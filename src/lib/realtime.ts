import async from 'async'
import Chance from 'chance'
import cookie from 'cookie'
import cookieParser from 'cookie-parser'
import moment from 'moment'
import randomcolor from 'randomcolor'
import { Socket } from 'socket.io'
import { config } from './config'

import { History } from './history'
import { logger } from './logger'
import { Author, Note, Revision, User } from './models'
import { EditorSocketIOServer } from './ot/editor-socketio-server'

export type SocketWithNoteId = Socket & { noteId: string }

const chance = new Chance()

/* eslint-disable @typescript-eslint/no-use-before-define */
const realtime: any = {
  io: null,
  onAuthorizeSuccess: onAuthorizeSuccess,
  onAuthorizeFail: onAuthorizeFail,
  secure: secure,
  connection: connection,
  getStatus: getStatus,
  isReady: isReady,
  maintenance: true
}
/* eslint-enable @typescript-eslint/no-use-before-define */

const disconnectSocketQueue: SocketWithNoteId[] = []

function onAuthorizeSuccess (data, accept): void {
  accept()
}

function onAuthorizeFail (data, message, error, accept): void {
  accept() // accept whether authorize or not to allow anonymous usage
}

// secure the origin by the cookie
function secure (socket: Socket, next: (err?: any) => void): void {
  try {
    const handshakeData = socket.request
    if (handshakeData.headers.cookie) {
      handshakeData.cookie = cookie.parse(handshakeData.headers.cookie)
      handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie[config.sessionName], config.sessionSecret)
      if (handshakeData.sessionID &&
        handshakeData.cookie[config.sessionName] &&
        handshakeData.cookie[config.sessionName] !== handshakeData.sessionID) {
        logger.debug(`AUTH success cookie: ${handshakeData.sessionID}`)
        return next()
      } else {
        next(new Error('AUTH failed: Cookie is invalid.'))
      }
    } else {
      next(new Error('AUTH failed: No cookie transmitted.'))
    }
  } catch (ex) {
    next(new Error('AUTH failed:' + JSON.stringify(ex)))
  }
}

function emitCheck (note): void {
  const out = {
    title: note.title,
    updatetime: note.updatetime,
    lastchangeuser: note.lastchangeuser,
    lastchangeuserprofile: note.lastchangeuserprofile,
    authors: note.authors,
    authorship: note.authorship
  }
  realtime.io.to(note.id).emit('check', out)
}

// actions
const users = {}
const notes = {}

let saverSleep = false

function finishUpdateNote (note: any, _note: Note, callback: any) {
  if (!note || !note.server) return callback(null, null)
  const body = note.server.document
  const title = note.title = Note.parseNoteTitle(body)
  const values = {
    title: title,
    content: body,
    authorship: note.authorship,
    lastchangeuserId: note.lastchangeuser,
    lastchangeAt: Date.now()
  }
  _note.update(values).then(function (_note) {
    saverSleep = false
    return callback(null, _note)
  }).catch(function (err) {
    logger.error(err)
    return callback(err, null)
  })
}

function updateHistory (userId, note, time?): void {
  const noteId = note.alias ? note.alias : Note.encodeNoteId(note.id)
  if (note.server) History.updateHistory(userId, noteId, note.server.document, time)
}

function updateNote (note: any, callback: (err, note) => any): any {
  Note.findOne({
    where: {
      id: note.id
    }
  }).then(function (_note) {
    if (!_note) return callback(null, null)
    // update user note history
    const tempUsers = Object.assign({}, note.tempUsers)
    note.tempUsers = {}
    Object.keys(tempUsers).forEach(function (key) {
      updateHistory(key, note, tempUsers[key])
    })
    if (note.lastchangeuser) {
      if (_note.lastchangeuserId !== note.lastchangeuser) {
        User.findOne({
          where: {
            id: note.lastchangeuser
          }
        }).then(function (user) {
          if (!user) return callback(null, null)
          note.lastchangeuserprofile = User.getProfile(user)
          return finishUpdateNote(note, _note, callback)
        }).catch(function (err) {
          logger.error(err)
          return callback(err, null)
        })
      } else {
        return finishUpdateNote(note, _note, callback)
      }
    } else {
      note.lastchangeuserprofile = null
      return finishUpdateNote(note, _note, callback)
    }
  }).catch(function (err) {
    logger.error(err)
    return callback(err, null)
  })
}

// update when the note is dirty
setInterval(function () {
  async.each(Object.keys(notes), function (key, callback) {
    const note = notes[key]
    if (note.server.isDirty) {
      logger.debug(`updater found dirty note: ${key}`)
      note.server.isDirty = false
      updateNote(note, function (err, _note) {
        // handle when note already been clean up
        if (!notes[key] || !notes[key].server) return callback(null, null)
        if (!_note) {
          realtime.io.to(note.id).emit('info', {
            code: 404
          })
          logger.error('note not found: ', note.id)
        }
        if (err || !_note) {
          for (let i = 0, l = note.socks.length; i < l; i++) {
            const sock = note.socks[i]
            if (typeof sock !== 'undefined' && sock) {
              setTimeout(function () {
                sock.disconnect()
              }, 0)
            }
          }
          return callback(err, null)
        }
        note.updatetime = moment(_note.lastchangeAt).valueOf()
        emitCheck(note)
        return callback(null, null)
      })
    } else {
      return callback(null, null)
    }
  }, function (err) {
    if (err) return logger.error('updater error', err)
  })
}, 1000)

// save note revision in interval
setInterval(function () {
  if (saverSleep) return
  Revision.saveAllNotesRevision(function (err, notes) {
    if (err) return logger.error('revision saver failed: ' + err)
    if (notes && notes.length <= 0) {
      saverSleep = true
    }
  })
}, 60000 * 5)

let isConnectionBusy: boolean
let isDisconnectBusy: boolean

const connectionSocketQueue: SocketWithNoteId[] = []

function getStatus (callback) {
  Note.count().then(function (notecount) {
    const distinctaddresses: string[] = []
    const regaddresses: string[] = []
    const distinctregaddresses: string[] = []
    Object.keys(users).forEach(function (key) {
      const user = users[key]
      if (!user) return
      let found = false
      for (let i = 0; i < distinctaddresses.length; i++) {
        if (user.address === distinctaddresses[i]) {
          found = true
          break
        }
      }
      if (!found) {
        distinctaddresses.push(user.address)
      }
      if (user.login) {
        regaddresses.push(user.address)
        let found = false
        for (let i = 0; i < distinctregaddresses.length; i++) {
          if (user.address === distinctregaddresses[i]) {
            found = true
            break
          }
        }
        if (!found) {
          distinctregaddresses.push(user.address)
        }
      }
    })
    User.count().then(function (regcount) {
      // eslint-disable-next-line standard/no-callback-literal
      return callback ? callback({
        onlineNotes: Object.keys(notes).length,
        onlineUsers: Object.keys(users).length,
        distinctOnlineUsers: distinctaddresses.length,
        notesCount: notecount,
        registeredUsers: regcount,
        onlineRegisteredUsers: regaddresses.length,
        distinctOnlineRegisteredUsers: distinctregaddresses.length,
        isConnectionBusy: isConnectionBusy,
        connectionSocketQueueLength: connectionSocketQueue.length,
        isDisconnectBusy: isDisconnectBusy,
        disconnectSocketQueueLength: disconnectSocketQueue.length
      }) : null
    }).catch(function (err) {
      return logger.error('count user failed: ' + err)
    })
  }).catch(function (err) {
    return logger.error('count note failed: ' + err)
  })
}

function isReady (): boolean {
  return realtime.io &&
    Object.keys(notes).length === 0 && Object.keys(users).length === 0 &&
    connectionSocketQueue.length === 0 && !isConnectionBusy &&
    disconnectSocketQueue.length === 0 && !isDisconnectBusy
}

function extractNoteIdFromSocket (socket): string | boolean {
  if (!socket || !socket.handshake) {
    return false
  }
  if (socket.handshake.query && socket.handshake.query.noteId) {
    return socket.handshake.query.noteId
  } else {
    return false
  }
}

function parseNoteIdFromSocket (socket, callback: (err, noteId) => void): void {
  const noteId = extractNoteIdFromSocket(socket)
  if (!noteId) {
    return callback(null, null)
  }
  Note.parseNoteId(noteId, function (err, id) {
    if (err || !id) return callback(err, id)
    return callback(null, id)
  })
}

function buildUserOutData (user) {
  const out = {
    id: user.id,
    login: user.login,
    userid: user.userid,
    photo: user.photo,
    color: user.color,
    cursor: user.cursor,
    name: user.name,
    idle: user.idle,
    type: user.type
  }
  return out
}

function emitOnlineUsers (socket: SocketWithNoteId): void {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const users: any[] = []
  Object.keys(notes[noteId].users).forEach(function (key) {
    const user = notes[noteId].users[key]
    if (user) {
      users.push(buildUserOutData(user))
    }
  })
  const out = {
    users: users
  }
  realtime.io.to(noteId).emit('online users', out)
}

function emitUserStatus (socket: SocketWithNoteId): void {
  const noteId = socket.noteId
  const user = users[socket.id]
  if (!noteId || !notes[noteId] || !user) return
  const out = buildUserOutData(user)
  socket.broadcast.to(noteId).emit('user status', out)
}

function emitRefresh (socket: SocketWithNoteId): void {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const note = notes[noteId]
  const out = {
    title: note.title,
    docmaxlength: config.documentMaxLength,
    owner: note.owner,
    ownerprofile: note.ownerprofile,
    lastchangeuser: note.lastchangeuser,
    lastchangeuserprofile: note.lastchangeuserprofile,
    authors: note.authors,
    authorship: note.authorship,
    permission: note.permission,
    createtime: note.createtime,
    updatetime: note.updatetime
  }
  socket.emit('refresh', out)
}

function isDuplicatedInSocketQueue (queue: Socket[], socket: Socket): boolean {
  for (let i = 0; i < queue.length; i++) {
    if (queue[i] && queue[i].id === socket.id) {
      return true
    }
  }
  return false
}

function clearSocketQueue (queue: Socket[], socket: Socket): void {
  for (let i = 0; i < queue.length; i++) {
    if (!queue[i] || queue[i].id === socket.id) {
      queue.splice(i, 1)
      i--
    }
  }
}

function connectNextSocket (): void {
  setTimeout(function () {
    isConnectionBusy = false
    if (connectionSocketQueue.length > 0) {
      // Otherwise we get a loop startConnection - failConnection - connectNextSocket
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      startConnection(connectionSocketQueue[0])
    }
  }, 1)
}

function failConnection (errorCode: number, errorMessage: string, socket: Socket): void {
  logger.error(errorMessage)
  // clear error socket in queue
  clearSocketQueue(connectionSocketQueue, socket)
  connectNextSocket()
  // emit error info
  socket.emit('info', {
    code: errorCode
  })
  socket.disconnect(true)
}

function interruptConnection (socket: Socket, noteId: string, socketId): void {
  if (notes[noteId]) delete notes[noteId]
  if (users[socketId]) delete users[socketId]
  if (socket) {
    clearSocketQueue(connectionSocketQueue, socket)
  } else {
    connectionSocketQueue.shift()
  }
  connectNextSocket()
}

function checkViewPermission (req, note): boolean {
  if (note.permission === 'private') {
    return !!(req.user?.logged_in && req.user.id === note.owner)
  } else if (note.permission === 'limited' || note.permission === 'protected') {
    return !!(req.user?.logged_in)
  } else {
    return true
  }
}

function finishConnection (socket: SocketWithNoteId, noteId: string, socketId: string): void {
  // if no valid info provided will drop the client
  if (!socket || !notes[noteId] || !users[socketId]) {
    return interruptConnection(socket, noteId, socketId)
  }
  // check view permission
  if (!checkViewPermission(socket.request, notes[noteId])) {
    interruptConnection(socket, noteId, socketId)
    return failConnection(403, 'connection forbidden', socket)
  }
  const note = notes[noteId]
  const user = users[socketId]
  // update user color to author color
  if (note.authors[user.userid]) {
    user.color = users[socket.id].color = note.authors[user.userid].color
  }
  note.users[socket.id] = user
  note.socks.push(socket)
  note.server.addClient(socket)
  note.server.setName(socket, user.name)
  note.server.setColor(socket, user.color)

  // update user note history
  updateHistory(user.userid, note)

  emitOnlineUsers(socket)
  emitRefresh(socket)

  // clear finished socket in queue
  clearSocketQueue(connectionSocketQueue, socket)
  // seek for next socket
  connectNextSocket()

  if (config.debug) {
    const noteId = socket.noteId
    logger.debug(`SERVER connected a client to [${noteId}]:`)
    logger.debug(JSON.stringify(user))
    logger.debug(notes)
    getStatus(function (data) {
      logger.debug(JSON.stringify(data))
    })
  }
}

function ifMayEdit (socket: SocketWithNoteId, originIsOperation: boolean, callback: (mayEdit: boolean) => void): void {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const note = notes[noteId]
  let mayEdit = true
  switch (note.permission) {
    case 'freely':
      // not blocking anyone
      break
    case 'editable':
    case 'limited':
      // only login user can change
      if (!socket.request.user || !socket.request.user.logged_in) {
        mayEdit = false
      }
      break
    case 'locked':
    case 'private':
    case 'protected':
      // only owner can change
      if (!note.owner || note.owner !== socket.request.user.id) {
        mayEdit = false
      }
      break
  }
  // if user may edit and this is a text operation
  if (originIsOperation && mayEdit) {
    // save for the last change user id
    if (socket.request.user && socket.request.user.logged_in) {
      note.lastchangeuser = socket.request.user.id
    } else {
      note.lastchangeuser = null
    }
  }
  return callback(mayEdit)
}

function operationCallback (socket: SocketWithNoteId, operation): void {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const note = notes[noteId]
  let userId = null
  // save authors
  if (socket.request.user && socket.request.user.logged_in) {
    const user = users[socket.id]
    if (!user) return
    userId = socket.request.user.id
    if (!note.authors[userId]) {
      Author.findOrCreate({
        where: {
          noteId: noteId,
          userId: userId
        },
        defaults: {
          noteId: noteId,
          userId: userId,
          color: user.color
        }
      }).then(function ([author, created]) {
        if (author) {
          note.authors[author.userId] = {
            userid: author.userId,
            color: author.color,
            photo: user.photo,
            name: user.name
          }
        }
      }).catch(function (err) {
        logger.error('operation callback failed: ' + err)
      })
    }
    note.tempUsers[userId] = Date.now()
  }
  // save authorship - use timer here because it's an O(n) complexity algorithm
  setImmediate(function () {
    note.authorship = Note.updateAuthorshipByOperation(operation, userId, note.authorship)
  })
}

function startConnection (socket: SocketWithNoteId): void {
  if (isConnectionBusy) return
  isConnectionBusy = true

  const noteId: string = socket.noteId
  if (!noteId) {
    return failConnection(404, 'note id not found', socket)
  }

  if (!notes[noteId]) {
    const include = [{
      model: User,
      as: 'owner'
    }, {
      model: User,
      as: 'lastchangeuser'
    }, {
      model: Author,
      as: 'authors',
      include: [{
        model: User,
        as: 'user'
      }]
    }]

    Note.findOne({
      where: {
        id: noteId
      },
      include: include
    }).then(function (note) {
      if (!note) {
        return failConnection(404, 'note not found', socket)
      }
      const owner = note.ownerId
      const ownerprofile = note.owner ? User.getProfile(note.owner) : null

      const lastchangeuser = note.lastchangeuserId
      const lastchangeuserprofile = note.lastchangeuser ? User.getProfile(note.lastchangeuser) : null

      const body = note.content
      const createtime = note.createdAt
      const updatetime = note.lastchangeAt
      const server = new EditorSocketIOServer(body, [], noteId, ifMayEdit, operationCallback)

      const authors = {}
      for (let i = 0; i < note.authors.length; i++) {
        const author = note.authors[i]
        const profile = User.getProfile(author.user)
        if (profile) {
          authors[author.userId] = {
            userid: author.userId,
            color: author.color,
            photo: profile.photo,
            name: profile.name
          }
        }
      }

      notes[noteId] = {
        id: noteId,
        alias: note.alias,
        title: note.title,
        owner: owner,
        ownerprofile: ownerprofile,
        permission: note.permission,
        lastchangeuser: lastchangeuser,
        lastchangeuserprofile: lastchangeuserprofile,
        socks: [],
        users: {},
        tempUsers: {},
        createtime: moment(createtime).valueOf(),
        updatetime: moment(updatetime).valueOf(),
        server: server,
        authors: authors,
        authorship: note.authorship
      }

      return finishConnection(socket, noteId, socket.id)
    }).catch(function (err) {
      return failConnection(500, err, socket)
    })
  } else {
    return finishConnection(socket, noteId, socket.id)
  }
}

isConnectionBusy = false
isDisconnectBusy = false

function disconnect (socket: SocketWithNoteId): void {
  if (isDisconnectBusy) return
  isDisconnectBusy = true

  logger.debug('SERVER disconnected a client')
  logger.debug(JSON.stringify(users[socket.id]))

  if (users[socket.id]) {
    delete users[socket.id]
  }
  const noteId = socket.noteId
  const note = notes[noteId]
  if (note) {
    // delete user in users
    if (note.users[socket.id]) {
      delete note.users[socket.id]
    }
    // remove sockets in the note socks
    let index
    do {
      index = note.socks.indexOf(socket)
      if (index !== -1) {
        note.socks.splice(index, 1)
      }
    } while (index !== -1)
    // remove note in notes if no user inside
    if (Object.keys(note.users).length <= 0) {
      if (note.server.isDirty) {
        updateNote(note, function (err, _note) {
          if (err) return logger.error('disconnect note failed: ' + err)
          // clear server before delete to avoid memory leaks
          note.server.document = ''
          note.server.operations = []
          delete note.server
          delete notes[noteId]
          if (config.debug) {
            logger.debug(notes)
            getStatus(function (data) {
              logger.debug(JSON.stringify(data))
            })
          }
        })
      } else {
        delete note.server
        delete notes[noteId]
      }
    }
  }
  emitOnlineUsers(socket)

  // clear finished socket in queue
  clearSocketQueue(disconnectSocketQueue, socket)
  // seek for next socket
  isDisconnectBusy = false
  if (disconnectSocketQueue.length > 0) {
    disconnect(disconnectSocketQueue[0])
  }

  if (config.debug) {
    logger.debug(notes)
    getStatus(function (data) {
      logger.debug(JSON.stringify(data))
    })
  }
}

// clean when user not in any rooms or user not in connected list
setInterval(function () {
  async.each(Object.keys(users), function (key, callback) {
    let socket = realtime.io.sockets.connected[key]
    if ((!socket && users[key]) ||
      (socket && (!socket.rooms || socket.rooms.length <= 0))) {
      logger.debug(`cleaner found redundant user: ${key}`)
      if (!socket) {
        socket = {
          id: key
        }
      }
      disconnectSocketQueue.push(socket)
      disconnect(socket)
    }
    return callback(null, null)
  }, function (err) {
    if (err) return logger.error('cleaner error', err)
  })
}, 60000)

function updateUserData (socket: Socket, user): void {
  // retrieve user data from passport
  if (socket.request.user && socket.request.user.logged_in) {
    const profile = User.getProfile(socket.request.user)
    user.photo = profile?.photo
    user.name = profile?.name
    user.userid = socket.request.user.id
    user.login = true
  } else {
    user.userid = null
    user.name = 'Guest ' + chance.last()
    user.login = false
  }
}

function connection (socket: SocketWithNoteId): void {
  if (realtime.maintenance) return
  parseNoteIdFromSocket(socket, function (err, noteId) {
    if (err) {
      return failConnection(500, err, socket)
    }
    if (!noteId) {
      return failConnection(404, 'note id not found', socket)
    }

    if (isDuplicatedInSocketQueue(connectionSocketQueue, socket)) return

    // store noteId in this socket session
    socket.noteId = noteId

    // initialize user data
    // random color
    let color = randomcolor()
    // make sure color not duplicated or reach max random count
    if (notes[noteId]) {
      let randomcount = 0
      const maxrandomcount = 10
      let found = false
      do {
        Object.keys(notes[noteId].users).forEach(function (userId) {
          if (notes[noteId].users[userId].color === color) {
            found = true
          }
        })
        if (found) {
          color = randomcolor()
          randomcount++
        }
      } while (found && randomcount < maxrandomcount)
    }
    // create user data
    users[socket.id] = {
      id: socket.id,
      address: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
      'user-agent': socket.handshake.headers['user-agent'],
      color: color,
      cursor: null,
      login: false,
      userid: null,
      name: null,
      idle: false,
      type: null
    }
    updateUserData(socket, users[socket.id])

    // start connection
    connectionSocketQueue.push(socket)
    startConnection(socket)
  })

  // received client refresh request
  socket.on('refresh', function () {
    emitRefresh(socket)
  })

  // received user status
  socket.on('user status', function (data) {
    const noteId = socket.noteId
    const user = users[socket.id]
    if (!noteId || !notes[noteId] || !user) return
    logger.debug(`SERVER received [${noteId}] user status from [${socket.id}]: ${JSON.stringify(data)}`)
    if (data) {
      user.idle = data.idle
      user.type = data.type
    }
    emitUserStatus(socket)
  })

  // received note permission change request
  socket.on('permission', function (permission) {
    // need login to do more actions
    if (socket.request.user && socket.request.user.logged_in) {
      const noteId = socket.noteId
      if (!noteId || !notes[noteId]) return
      const note = notes[noteId]
      // Only owner can change permission
      if (note.owner && note.owner === socket.request.user.id) {
        if (permission === 'freely' && !config.allowAnonymous && !config.allowAnonymousEdits) return
        note.permission = permission
        Note.update({
          permission: permission
        }, {
          where: {
            id: noteId
          }
        }).then(function (count) {
          if (!count) {
            return
          }
          const out = {
            permission: permission
          }
          realtime.io.to(note.id).emit('permission', out)
          for (let i = 0, l = note.socks.length; i < l; i++) {
            const sock = note.socks[i]
            if (typeof sock !== 'undefined' && sock) {
              // check view permission
              if (!checkViewPermission(sock.request, note)) {
                sock.emit('info', {
                  code: 403
                })
                setTimeout(function () {
                  sock.disconnect(true)
                }, 0)
              }
            }
          }
        }).catch(function (err) {
          return logger.error('update note permission failed: ' + err)
        })
      }
    }
  })

  // delete a note
  socket.on('delete', function () {
    // need login to do more actions
    if (socket.request.user && socket.request.user.logged_in) {
      const noteId = socket.noteId
      if (!noteId || !notes[noteId]) return
      const note = notes[noteId]
      // Only owner can delete note
      if (note.owner && note.owner === socket.request.user.id) {
        Note.destroy({
          where: {
            id: noteId
          }
        }).then(function (count) {
          if (!count) return
          for (let i = 0, l = note.socks.length; i < l; i++) {
            const sock = note.socks[i]
            if (typeof sock !== 'undefined' && sock) {
              sock.emit('delete')
              setTimeout(function () {
                sock.disconnect(true)
              }, 0)
            }
          }
        }).catch(function (err) {
          return logger.error('delete note failed: ' + err)
        })
      }
    }
  })

  // reveiced when user logout or changed
  socket.on('user changed', function () {
    logger.info('user changed')
    const noteId = socket.noteId
    if (!noteId || !notes[noteId]) return
    const user = notes[noteId].users[socket.id]
    if (!user) return
    updateUserData(socket, user)
    emitOnlineUsers(socket)
  })

  // received sync of online users request
  socket.on('online users', function () {
    const noteId = socket.noteId
    if (!noteId || !notes[noteId]) return
    const users: any = []
    Object.keys(notes[noteId].users).forEach(function (key) {
      const user = notes[noteId].users[key]
      if (user) {
        users.push(buildUserOutData(user))
      }
    })
    const out = {
      users: users
    }
    socket.emit('online users', out)
  })

  // check version
  socket.on('version', function () {
    socket.emit('version', {
      version: config.fullversion,
      minimumCompatibleVersion: config.minimumCompatibleVersion
    })
  })

  // received cursor focus
  socket.on('cursor focus', function (data) {
    const noteId = socket.noteId
    const user = users[socket.id]
    if (!noteId || !notes[noteId] || !user) return
    user.cursor = data
    const out = buildUserOutData(user)
    socket.broadcast.to(noteId).emit('cursor focus', out)
  })

  // received cursor activity
  socket.on('cursor activity', function (data) {
    const noteId = socket.noteId
    const user = users[socket.id]
    if (!noteId || !notes[noteId] || !user) return
    user.cursor = data
    const out = buildUserOutData(user)
    socket.broadcast.to(noteId).emit('cursor activity', out)
  })

  // received cursor blur
  socket.on('cursor blur', function () {
    const noteId = socket.noteId
    const user = users[socket.id]
    if (!noteId || !notes[noteId] || !user) return
    user.cursor = null
    const out = {
      id: socket.id
    }
    socket.broadcast.to(noteId).emit('cursor blur', out)
  })

  // when a new client disconnect
  socket.on('disconnect', function () {
    if (isDuplicatedInSocketQueue(disconnectSocketQueue, socket)) return
    disconnectSocketQueue.push(socket)
    disconnect(socket)
  })
}

export { realtime }