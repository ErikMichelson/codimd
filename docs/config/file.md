# CodiMD Config file

The config file is named `config.json` and is located in the root directory of CodiMD.  
If the config file does not exist yet in your installation, run the setup script (`bin/setup`) or copy the file `config.json.example` to `config.json`.

The configuration file must be a valid JSON file. Paths are specified as absolute ones or relative to CodiMD's root directory.

## Node.JS runtime configuration

| variables | example values | description |
| --------- | ------ | ----------- |
| `debug` | `true` or `false` | Enables or disables the debug mode which shows more logs. Should be disabled for production instances. |


## CodiMD basics
This section contains the basic configuration of CodiMD.

| variables | example values | description |
| --------- | ------ | ----------- |
| `domain` | `localhost`, `codimd.example.com` | The domain name on which CodiMD should listen for requests. This needs to be set, otherwise some functionality might be broken. |
| `urlPath` | ` `, `codimd` | If CodiMD should be served from a sub-URL-path, it will be defined here. Otherwise keep it blank. <br><br>**Example:** CodiMD should be available at `www.example.com/codimd-instance`. Then this would be `codimd-instance`. |
| `host` | `0.0.0.0`, `::`, `127.0.0.1`, `::1` | The ip address on which CodiMD is listening for requests. `0.0.0.0` and `::` are interpreted as all IPs of the host. |
| `port` | `80`, `443` | The port on which CodiMD is listening. As CodiMD uses the HTTP protocol, port 80 or 443 (HTTPS) are recommended. |
| `path` | ` `, `/var/run/codimd.sock` | Alternatively to `host` and `port`, CodiMD can also listen for requests on a UNIX socket. To enable this, specify the path of the socket file. (If specified, `host` and `port` are ignored) |
| `loglevel` | `info` | Defines what kind of logs are provided to stdout. Available options: `debug`, `verbose`, `info`, `warn`, `error` |
| `urlAddPort` | `true` or `false` | If enabled, CodiMD appends its port number to internal links (for ports `80` or `443` it won't be applied) |
| `protocolUseSSL` | `true` or `false` | If enabled, CodiMD uses the TLS-secured HTTPS protocol for fetching resources and links. |
| `allowOrigin` | `['localhost', 'my-system.example.com']` | CORS whitelisted domains for non-API calls. |


## Database configuration
CodiMD relies on a database as storage for notes, note revisions and users. Supported databases are PostgreSQL, MySQL, MariaDB, MSSQL and SQLite.  

| variables | example values | description |
| --------- | ------ | ----------- |
| `db` | `{dialect: ..., host: ..., ...}` | An object containing the database connection values. The syntax equals to the [sequelize options-object](https://sequelize.readthedocs.io/en/latest/api/sequelize/). |
| `dbURL` | `mysql://username:password@localhost:3306/codimd` | The database host and credentials in URL type. If this property is set, it will override certain properties of the `db` config object. |


## TLS configuration
CodiMD is able to provide a secure HTTPS interface. Therefore you need to configure the TLS-certificate, private key, etc.  
The TLS-configuration is an own object in the config file. So your config will look like this:
```json
...
allowOrigin: ['localhost'],
tls: {
    enable: true,
    keyPath: '/etc/ssl/codimd/privkey.pem',
    ...
},
...
```

| variables | example values | description |
| --------- | ------ | ----------- |
| `enable` | `true` or `false` | Set to true to use the integrated TLS-secured server. If set to `true`, the setting `protocolUseSSL` will be automatically also `true`. The following TLS-related config settings will only take effect if this is `true`. |
| `keyPath` | `/etc/ssl/codimd/privkey.pem` | Path to the private key file for TLS encryption. |
| `certPath` | `/etc/ssl/codimd/public.crt` | Path to the public certificate file for TLS encryption. |
| `caPath` | `/etc/ssl/codimd/ca.crt` | Path to the public certificate chain file of the CA. |
| `dhParamPath` | `/etc/ssl/dhparams.pem` | Path to the DH-parameter file. |


## HSTS configuration
If you have enabled TLS-encryption for CodiMD, you maybe also want to enable [_HTTP Strict Transport Security_](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) for advanced security.  
Like the TLS-configuration, the HSTS-configuration is an own object in the config file too.
```json
...
hsts: {
    enable: true,
    maxAgeSeconds: 86400 * 365,
    ...
}
```

| variables | example values | description |
| --------- | ------ | ----------- |
| `enable` | `true` or `false` | Set to `true` to enable the HSTS feature. The following HSTS-related settings will only take effect if this is `true`. |
| `maxAgeSeconds` | `31536000` | Maximum duration in seconds to tell clients to keep HSTS status. |
| `includeSubDomains` | `true` or `false` | Set to `true` to include sub-domains of the CodiMD domain into the HSTS headers. |
| `preload` | `true` or `false` | Set to `true` to allow pre-loading of the HSTS-status in browsers. |


## Content-security-policy settings
CodiMD supports the Content-security-policy standard to restrict the origins of external content.  
The CSP-configuration is an own object in the config file.
```json
csp: {
    enable: true,
    directives: {
        defaultSrc: ['\'self\''],
        scriptSrc: ['js.example.com'],
        imgSrc: ['*'],
        styleSrc: ['css.example.com'],
        fontSrc: ['font.example.com'],
        objectSrc: ['*'],
        mediaSrc: ['*'],
        childSrc: ['*'],
        connectSrc: ['*']
    },
    ...
}
```

| variables | example values | description |
| --------- | ------ | ----------- |
| `enable` | `true` or `false` | Set to `true` to enable Content-security-policies. The following CSP-related settings will only take effect if this is set to `true`. |
| `directives` | _see the example block above this table_ | Additional CSP directives to the default ones that are needed for CodiMD to work. |
| `addDefaults` | `true` or `false` | Set to `true` to add the recommended default policies. |
| `addDisqus` | `true` or `false` | Set to `true` to include the policies for Disqus. If disabled, Disqus integration will be broken. | 
| `addGoogleAnalytics` | `true` or `false` | Set to `true` to include the policies for Google Analytics. If disabled, Google Analytics integration will be broken. |
| `upgradeInsecureRequests` | `auto` | Sets the [directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests) to treat insecure loaded resources (unencrypted HTTP) as if they have been loaded over HTTPS. |
| `reportURI` | `https://csp-report.example.com/` | Allows to add an URL for CSP reports in case of violations against the policies. |


## Permission system

| variables | example values | description |
| --------- | ------ | ----------- |
| `allowAnonymous` | `true` or `false` | Set to `true` to allow anonymous guests the general usage of CodiMD. |
| `allowAnonymousEdits` | `true` or `false` | Set to `true` to allow anonymous guests the editing of notes, if `allowAnonymous` is set to `true`. Registered users will then have the option to mark a note as *freely*. |
| `defaultPermission` | _one of the following:_ <br>`freely`, `editable`, `limited`, `locked`, `protected`, `private` | The default permission on notes created by registered users. See more about the permissions [here](/usage/permissions.md). |
| `allowFreeURL` | `true` or `false` | Set to `true` to allow new note creation by accessing a nonexistent note URL. This is the behavior familiar from [Etherpad](https://github.com/ether/etherpad-lite). |
| `forbiddenNoteIDs` | `['robots.txt', 'api', 'css']` | If `allowFreeURL` is enabled, notes with the here defined names may not be created. It is recommended to include all CodiMD system directories here. |
| `allowPDFExport` | `true` or `false` | Set to `true` to enable the feature of exporting notes as a pdf file.<br><br> **This feature is currently always disabled due to security problems with the export.** | 

## Image upload storage
The storage location of images that were uploaded on notes can be changed here. CodiMD is able to upload images to local filesystem, imgur, MinIO, Amazon S3, Azure and Lutim. The local filesystem is chosen by default.

| variables | example values | description |
| --------- | ------ | ----------- |
| `allowedUploadMimeTypes` | `['image/jpeg', 'image/png', 'image/svg+xml']` | List of MIME-Types that are allowed to be uploaded as images. |
| `imageUploadType` | `imgur`, `s3`, `minio`, `azure`, `lutim` or `filesystem` | Where to store the uploaded images. |

### Lutim storage configuration
If `lutim` is selected as `imageUploadType`, the following properties need to be set.

| variables | example values | description |
| --------- | ------ | ----------- |
| `lutim` | `{url: 'https://framapic.org'}` | Configuration object containing the base URL of the lutim instance used to upload user images. |


### imgur storage configuration
If `imgur` is selected as `imageUploadType`, the following properties need to be set.

| variables | example values | description |
| --------- | ------ | ----------- |
| `imgur` | `{clientID: 'my-client-secret-1234'}` | Configuration object containing the client secret from imgur to not run through the public uploads API. |


### Amazon S3 storage configuration
If `s3` is selected as `imageUploadType`, the following properties need to be set. They are an own object in the config file. **Additionally the `s3bucket` property needs to be set.** For more information read the [guide](/guides/storage/s3.md).
```json
...
s3: {
    accessKeyId: '',
    secretAccessKey: '',
    region: ''
},
s3bucket: '',
...
```

| variables | example values | description |
| --------- | ------ | ----------- |
| `accessKeyId` | `AKIAI633LOZ...` | The access key id of your AWS IAM user. |
| `secretAccessKey` | `secretsecretkey123` | The secret access key that you've downloaded from the security credential manager. |
| `region` | `us-east-1` | The region of the AWS server that holds the bucket to use `s3-<region>-.amazonaws.com` as URL. If left blank, `s3.amazonaws.com` will be used as URL. |


### MinIO storage configuration
If `minio` is selected as `imageUploadType`, the following properties need to be set. They are an own object in the config file. **In addition you also have to set the `s3bucket` property (even though you use MinIO instead of s3!).** For more information read the [guide](/guides/storage/minio.md).
```json
...
minio: {
    accessKey: '',
    ...
},
s3bucket: '',
...
```

| variables | example values | description |
| --------- | ------ | ----------- |
| `accessKey` | `888MXJ7EP4XXXXXXXXX` | The access key for your MinIO bucket. |
| `secretKey` | `yQS2EbM1Y6IJrp/1BUKWq2` | The secret key for your MinIO bucket. |
| `endPoint` | `localhost` | The domain or hostname of the MinIO server. |
| `secure` | `true` or `false` | Set to `true` to use an encrypted HTTPS connection to the MinIO server. |
| `port` | `9000` | The port used for uploads to MinIO. |


### Azure storage configuration
If `azure` is selected as `imageUploadType`, the following properties need to be set. They are an own object in the config file.
```json
...
azure: {
    connectionString: '',
    container: '',
},
...
```

| variables | example values | description |
| --------- | ------ | ----------- |
| `connectionString` | `https://example.blob.core.windows.net/codimd?0f6546sfg0seg0` | The Azure storage blob [connection string](https://docs.microsoft.com/en-us/azure/kusto/api/connection-strings/storage). |
| `container` | `codimd-store1` | The id of your container. |


## Advanced configuration: Paths
By default CodiMD uses paths below its root directory for storage of temporary files, docs and uploads. You can redefine those here.

| variables | example values | description |
| --------- | ------ | ----------- |
| `viewPath` | `./public/views` | Path of the frontend templates. |
| `tmpPath` | `/tmp/codimd` | Path for temporary files. |
| `defaultNotePath` | `./public/default.md` | This file will be used as template for new notes. Is is usually blank to start with a fresh note. |
| `docsPath` | `./public/docs` | Path to documents like release-notes, imprint, features page or privacy statement. |
| `uploadsPath` | `./public/uploads` | Path to the directory where uploaded files are stored, if local uploads are allowed. |


## Advanced configuration: Session

| variables | example values | description |
| --------- | ------ | ----------- |
| `sessionName` | `connect.sid` | The name of the cookie that stores the session identifier on the client. |
| `sessionSecret` | ` `, `secret-secret-string` | The secret that is used to encrypt session data. If this field is left blank, a randomly generated session secret will be used. |
| `sessionSecretLen` | `128` | If `sessionSecret` is blank, a random secret of the here specified length will be used instead. |
| `sessionLife` | `604800` | Maximum time in seconds a session can be used without re-login. |


## Advanced configuration: Miscellaneous
| variables | example values | description |
| --------- | ------ | ----------- |
| `allowGravatar` | `true` or `false` | Allow the usage of [Libravatar](https://www.libravatar.org/) for user profile pictures. Libravatar is a federated open-source alternative to Gravatar. |
| `documentMaxLength` | `100000` | Maximum length of documents stored in CodiMD. Caution: Too high limits open your CodiMD instance up to easier DoS attacks. |
| `heartbeatInterval` | `5000` | Time interval in milliseconds used for heartbeats that are send out by the client to check that the websocket connection is still conencted. |
| `heartbeatTimeout` | `10000` | Time in milliseconds that is allowed to pass without heartbeat before the websocket connection is considered disconnected. |
| `linkifyHeaderStyle` | `keep-case`, `lower-case` or `gfm` | 'Default linking style for headers used by the markdown rendering engine for notes. For more details see [here](/config/linkify.md). |
| `sourceURL` | `https://github.com/codimd/server/tree/<current commit>` | Provides the link to the source code of CodiMD on the entry page. (Please, make sure you change this when you run a modified version!) |
| `staticCacheTime` | `86400` | Time in seconds that static assets delivered from CodiMD are cached on the client. |
| `tooBusyLag` | `70` | Maximum lag (in milliseconds) allowed in the NodeJS event loop, before the CodiMD tells new connections, that the server is too busy at the moment, and handles existing requests first. |


## Authentication providers
CodiMD uses the passport library for authentication. As it has many connectors, there are plenty of possibilities how to authenticate against CodiMD if enabled.


### Local account (login by email)
Local accounts are stored in CodiMD's database. Users authenticate with their email address and password. Currently there is no option for an user to change its own password. Local accounts can be managed with the [command line tool `bin/manage_users`](/guides/local-cli-tool.md). By default sign-in to and signing-up for local accounts is enabled.

| variables | example values | description |
| --------- | ------ | ----------- |
| `email` | `true` or `false` | Set to `false` to disallow email sign-in. |
| `allowEmailRegister`  | `true` or `false` | Set to `false` to disallow registration of new accounts using an email address. If set to `false`, you can still create accounts using the command line tool. This setting has no effect if `email` is `false`. |


### Dropbox Login
CodiMD supports login with your Dropbox account. To obtain the clientId, appKey and secret, you need to register your CodiMD instance as an app in the [Dropbox developer tools](https://www.dropbox.com/developers/apps). 

| variables | example values | description |
| --------- | ------ | ----------- |
| `dropbox` | `{appKey: 'abc123', clientID: '123456', clientSecret: 'secretsecret'}` | An object containing your appKey, client ID and client secret. |


### Facebook Login
To enable Facebook login, you need to register your CodiMD instance through the [Facebook app console](https://developers.facebook.com/apps).

| variables | example values | description |
| --------- | ------ | ----------- |
| `facebook` | `{clientID: ..., clientSecret: ...}` | An object containing your client ID and client secret. |


### GitHub Login
To enable GitHub login, you need to register your CodiMD instance at the GitHub developer page. For more details have a look at the [GitHub auth guide](/guides/auth/github.md).

| variables | example values | description |
| --------- | ------ | ----------- |
| `github` | `{clientID: ..., clientSecret: ...}` | An object containing your client ID and client secret. |


### Twitter Login
To enable Twitter login, you need to register your CodiMD instance at the [Twitter developer tools](https://developer.twitter.com/apps). For more details have a look at the [Twitter auth guide](guides/auth/twitter.md).

| variables | example values | description |
| --------- | ------ | ----------- |
| `twitter` | `{consumerKey: ..., consumerSecret: ...}` | An object containing your consumer key and secret. |


### Google Login
To enable Google login, you need to register your CodiMD instance at the [Google API console](https://console.cloud.google.com/apis).

| variables | example values | description |
| --------- | ------ | ----------- |
| `google` | `{clientID: ..., clientSecret: ...}` | An object containing your client ID and client secret. |


### GitLab Login

| variables | example values | description |
| --------- | ------ | ----------- |
| `gitlab` | `{baseURL: ..., scope: ..., version: ..., clientID: ..., clientSecret: ...}` | An object containing your GitLab application data. Refer to the [GitLab guide](guides/auth/gitlab-self-hosted.md) for more details! |



### LDAP Login

| variables | example values | description |
| --------- | ------ | ----------- |
| `ldap` | `{providerName: ..., url: ..., bindDn: ..., bindCredentials: ..., searchBase: ..., searchFilter: ..., searchAttributes: ..., usernameField: ..., useridField: ..., tlsca: ...}` | An object detailing the LDAP connection. Refer to the [LDAP-AD guide](guides/auth/ldap-AD.md) for more details! |

### Mattermost Login

| variables | example values | description |
| --------- | ------ | ----------- |
| `mattermost` | `{baseURL: ..., clientID: ..., clientSecret: ...}` | An object containing the base URL of your Mattermost application data. Refer to the [Mattermost guide](guides/auth/mattermost-self-hosted.md) for more details! |

### OAuth2 Login

| variables | example values | description |
| --------- | ------ | ----------- |
| `oauth2` | `{baseURL: ..., userProfileURL: ..., userProfileUsernameAttr: ..., userProfileDisplayNameAttr: ..., userProfileEmailAttr: ..., tokenURL: ..., authorizationURL: ..., clientID: ..., clientSecret: ...}` | An object detailing your OAuth2 provider. Refer to the [Mattermost](guides/auth/mattermost-self-hosted.md) or [Nextcloud](guides/auth/nextcloud.md) examples for more details!|

### SAML Login

| variables | example values | description |
| --------- | ------ | ----------- |
| `saml` | `{idpSsoUrl: ..., idpCert: ..., issuer: ..., identifierFormat: ..., disableRequestedAuthnContext: ..., groupAttribute: ..., externalGroups: [], requiredGroups: [], attribute: {id: ..., username: ..., email: ...}}` | An object detailing your SAML provider. Refer to the [OneLogin](guides/auth/saml-onelogin.md) and [SAML](guides/auth/saml.md) guides for more details! |

---

The config file is processed
in [`lib/config/index.js`](../lib/config/index.js) - so this is the first
place to look if anything is missing not obvious from this document. The
default values are defined in [`lib/config/default.js`](../lib/config/default.js),
in case you wonder if you even need to override it.
