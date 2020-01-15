# Configuration using Environment variables

For the usage with Docker or cloud hosting services it is easier to configure CodiMD with environment variables. Many of the configurable parameters from the config file have an equivalent environment variable. Be sure to read the [documentation for the config](/config/file.md) file too, as it contains more detailed descriptions.

Environment variables take precedence over configurations from the config files. Therefore the corresponding config file property is listed together with the environment variable.
The variables generally start with `CMD_` for our own options, but we also list
node-specific options you can configure this way.


## Node.JS runtime configuration

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `NODE_ENV` | _none_ | `production` or `development` | Sets the current environment. The corresponding settings from the config file will be loaded. |
| `DEBUG` | `debug` | `true` or `false` | Enables or disables debug mode which shows more logs. Should be disabled for production instances. |


## CodiMD basics
This section contains the basic configuration of CodiMD.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_DOMAIN` | `domain` | `localhost`, `codimd.example.com` | The domain at which CodiMD is listening. |
| `CMD_URL_PATH` | `urlPath` | ` `, `codimd` | If CodiMD should be served "from a subdirectory", the path needs to be specified here. |
| `CMD_HOST` | `host` | `0.0.0.0`, `127.0.0.1`, `::1` | The ip address on which CodiMD is listening for requests. |
| `CMD_PORT` | `port` | `80`, `443` | The port on which CodiMD should be listening. |
| `CMD_PATH` | `path` | ` `, `/var/run/codimd.sock` | UNIX socket path to listen on as alternative to `host` and `port`. |
| `CMD_LOGLEVEL` | `loglevel` | `info` | Defines which is the least important log level that will be reported to the console. |
| `CMD_URL_ADDPORT` | `urlAddPort` | `true` or `false` | If enabled, CodiMD appends its port number to internal links. |
| `CMD_PROTOCOL_USESSL` | `protocolUseSSL` | `true` or `false` | If enabled, CodiMD uses the HTTPS protocol for internal links and resources. |
| `CMD_ALLOW_ORIGIN` | `allowOrigin` | `['localhost', 'my-system.example.com']` | CORS whitelisted domains for non-API calls. |


## Database configuration
CodiMD relies on a database as storage for notes, note revisions and users. Supported databases are PostgreSQL, MySQL, MariaDB, MSSQL and SQLite.  
The database needs to be configured in the config file.


## TLS configuration
CodiMD is able to provide a secure HTTPS interface. Therefore you need to configure the TLS-certificate, private key, etc.  
The TLS-configuration needs to be done in the config file.


## HSTS configuration
If you have enabled TLS-encryption for CodiMD, you maybe also want to enable [HTTP Strict Transport Security](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) for advanced security.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_HSTS_ENABLE` | `hsts.enable` | `true` or `false` | Set to `true` to enable the HSTS feature. The other HSTS will only take effect if this is `true`. |
| `CMD_HSTS_MAX_AGE` | `hsts.maxAgeSeconds` | `31536000` | Maximum duration in seconds to tell clients to keep HSTS status. |
| `CMD_HSTS_INCLUDE_SUBDOMAINS` | `hsts.includeSubDomains` | `true` or `false` | Set to `true` to include sub-domains of the CodiMD domain into the HSTS headers. |
| `CMD_HSTS_PRELOAD` | `hsts.preload` | `true` or `false` | Set to `true` to allow pre-loading of the HSTS status by browsers. |


## Content-security-policy settings
CodiMD supports the Content-security-policy standard to restrict the origins of external content.  
Notice: Most of the CSP-settings do not have an environment variable and are defined in the config file instead.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_CSP_ENABLE` | `csp.enable` | `true` or `false` | Set to `false` to disable Content-security-policies. They are enabled by default. |
| `CMD_CSP_REPORTURI` | `csp.reportURI` | `https://csp-report.example.com/` | Allows to add an URL for CSP reports in case of violations against the policies.


## Permission system

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_ALLOW_ANONYMOUS` | `allowAnonymous` | `true` or `false` | Set to `true` to allow anonymous guests the general usage of CodiMD. |
| `CMD_ALLOW_ANONYMOUS_EDITS` | `allowAnonymousEdits` | `true` or `false` | Set to `true` to allow anonymous guests the editing of notes, if `allowAnonymous` is set to `true`. Registered users will then have the option to mark a note as _freely_. |
| `CMD_DEFAULT_PERMISSION` | `defaultPermission` | `freely`, `editable`, `limited`, ... | The default permission on notes created by registered users.<br>See more about the permissions [here](/usage/permissions.md). |
| `CMD_ALLOW_FREEURL` | `allowFreeURL` | `true` or `false` | Set to `true` to allow new note creation by accessing a non-existent note URL. |
| `CMD_FORBIDDEN_NOTE_IDS` | `forbiddenNoteIDs` | `['robots.txt', 'api', 'css']` | If allowFreeURL is enabled, notes with the here defined names may not be created. It is recommended to include all CodiMD system directories here. |
| `CMD_ALLOW_PDF_EXPORT` | `allowPDFExport` | `true` or `false` | Set to `true` to enable the feature of exporting notes as a pdf file.<br><br>**This feature is currently always disabled due to security problems with the export.** |


## Image upload storage
The image upload settings are defined in the config file.  
The configuration for MinIO and Azure as image storage backend is possible with environment variables.

### MinIO upload storage configuration
If `minio` is selected as `imageUploadType`, the following properties may be set.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_MINIO_ACCESS_KEY` | `minio.accessKey` | `888MXJ7EP4XXXXXXXXX` | The access key for your MinIO bucket. |
| `CMD_MINIO_SECRET_KEY` | `minio.secretKey` | `yQS2EbM1Y6IJrp/1BUK` | The secret key for your MinIO bucket. |
| `CMD_MINIO_ENDPOINT` | `minio.endPoint` | `localhost` | The domain or hostname of the MinIO server. |
| `CMD_MINIO_SECURE` | `minio.secure` | `true` or `false` | Set to `true` to use an encrypted HTTPS connection to the MinIO server. |
| `CMD_MINIO_PORT` | `minio.port` | `9000` | The port used for uploads to MinIO. |
| `CMD_S3_BUCKET` | `s3bucket` | `codimd-34fg34` | The MinIO bucket that will be used.<br>Yes, it's S3_BUCKET even if this is MinIO configuration. |

### Azure upload storage configuration
If `azure` is selected as `imageUploadType`, the following properties may be set.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_AZURE_CONNECTION_STRING` | `azure.connectionString` | `https://example.blob.core.windows.net/codimd?0f6546sfg0seg0` | The Azure storage blob [connection string](https://docs.microsoft.com/en-us/azure/kusto/api/connection-strings/storage). |
| `CMD_AZURE_CONTAINER` | `azure.container` | codimd-store1 | The id of your container. |


## Advanced configuration: Paths
By default CodiMD uses paths below its root directory for storage of temporary files, docs and uploads. You can redefine them in the config file.


## Advanced configuration: Session
Notice: Some of the session configuration attributes can only be set in the config file.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_SESSION_SECRET` | `sessionSecret` | ` `, `secret-secret` | The secret that is used to encrypt session data. If this field is left blank, a randomly generated session secret will be used. |
| `CMD_SESSION_LIFE` | `sessionLife` | `604800` | Maximum time in seconds a session can be used without re-login. |


## Advanced configuration: Miscellaneous
Notice: Some of the configuration attributes can only be set in the config file.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_ALLOW_GRAVATAR` | `allowGravatar` | `true` or `false` | Allow the usage of [Libravatar](https://www.libravatar.org/) for user profile pictures. Libravatar is a federated open-source alternative to Gravatar. |
| `CMD_LINKIFY_HEADER_STYLE` | `linkifyHeaderStyle` | `keep-case`, `lower-case` or `gfm` | Default linking style for headers used by the markdown rendering engine for notes. For more details see [here](/config/linkify.md). |
| `CMD_TOOBUSY_LAG` | `tooBusyLag` | `70` | Maximum lag (in milliseconds) allowed in the NodeJS event loop, before CodiMD tells new connections, that the server is too busy at the moment, and handles existing requests first. |


## Authentication providers
CodiMD uses the passport library for authentication. As it has many connectors, there are plenty of possibilities how to authenticate against CodiMD if enabled. Most of them can be configured via environment variables.


### Local account (login by email)
Local accounts are stored in CodiMD's database. Users authenticate with their email address and password. Currently there is no option for an user to change its own password. Local accounts can be managed with the [command line tool `bin/manage_users`](/guides/local-cli-tool.md). By default sign-in to and signing-up for local accounts is enabled.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_EMAIL` | `email` | `true` or `false` | Set to `false` to disallow email sign-in. The default is `true`. |
| `CMD_ALLOW_EMAIL_REGISTER` | `allowEmailRegister` | `true` or `false` | Set to `false` to disallow registration of new accounts using an email address. If set to `false`, you can still create accounts using the command line tool. This setting has no effect if `email` is `false`. |


### Dropbox Login
CodiMD supports login with your Dropbox account. To obtain the clientId, appKey and secret, you need to register your CodiMD instance as an app in the [Dropbox developer tools](https://www.dropbox.com/developers/apps).

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_DROPBOX_APPKEY` | `dropbox.appKey` | `abc123` | Your Dropbox app key. |
| `CMD_DROPBOX_CLIENTID` | `dropbox.clientID` | `123456` | Your Dropbox API client ID. |
| `CMD_DROPBOX_CLIENTSECRET` | `dropbox.clientSecret` | `secretsecret` | Your Dropbox API client secret. |


### Facebook Login
To enable Facebook login, you need to register your CodiMD instance through the [Facebook app console](https://developers.facebook.com/apps).

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_FACEBOOK_CLIENTID` | `facebook.clientID` | _no example_ | Your Facebook API client ID. |
| `CMD_FACEBOOK_CLIENTSECRET` | `facebook.clientSecret` | _no example_ | Your Facebook API client secret. |


### GitHub Login
To enable GitHub login, you need to register your CodiMD instance at the GitHub developer page. For more details have a look at the [GitHub auth guide](/guides/auth/github.md).

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_GITHUB_CLIENTID` | `github.clientID` | _no example_ | Your GitHub API client ID. |
| `CMD_GITHUB_CLIENTSECRET` | `github.clientSecret` | _no example_ | Your GitHub API client secret. |


### Twitter Login
To enable Twitter login, you need to register your CodiMD instance at the [Twitter developer tools](https://developer.twitter.com/apps). For more details have a look at the [Twitter auth guide](/guides/auth/twitter.md).

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_TWITTER_CONSUMERKEY` | `twitter.consumerKey` | _no example_ | Your Twitter API consumer key. |
| `CMD_TWITTER_CONSUMERSECRET` | `twitter.consumerSecret` | _no example_ | Your Twitter API consumer secret. |


### Google Login
To enable Google login, you need to register your CodiMD instance at the [Google API console](https://console.cloud.google.com/apis).

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_GOOGLE_CLIENTID` | `google.clientID` | _no example_ | Your Google API client ID. |
| `CMD_GOOGLE_CLIENTSECRET` | `google.clientSecret` | _no example_ | Your Google API client secret. |


### OpenID Login
To enable OpenID login, you need to set the following property to `true`.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_OPENID` | `openID` | `true` or `false` | Enables or disables login with OpenID. |

### GitLab Login
Refer to the [GitLab guide](/guides/auth/gitlab-self-hosted.md) for more details.  
Notice: If you're using GitLab API v3 (instead of v4), you need to set `gitlab.version` in the config file to `v3`.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_GITLAB_BASEURL` | `gitlab.baseURL` | `https://git.example.com` | The base URL of your GitLab instance. |
| `CMD_GITLAB_SCOPE` | `gitlab.scope` | `read_user` or `api` | The requested scope of access to the GitLab account. Default is `api`, because GitLab snippet import/export needs `api` scope. |
| `CMD_GITLAB_CLIENTID` | `gitlab.clientID` | _no example_ | Your GitLab API client ID. |
| `CMD_GITLAB_CLIENTSECRET` | `gitlab.clientSecret` | _no example_ | Your GitLab API client secret. |


### LDAP Login
Refer to the [LDAP-AD guide](/guides/auth/ldap-AD.md) for more details.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_LDAP_PROVIDERNAME` | `ldap.providerName` | `My institution` | Optional name to be displayed at login form indicating the LDAP provider. |
| `CMD_LDAP_URL` | `ldap.url` | `ldap://example.com` | The URL of the LDAP server. |
| `CMD_LDAP_BINDDN` | `ldap.bindDN` | `cn=codimd,ou=system,dc=example,dc=com` | The dn of the account that CodiMD is using for connecting to the LDAP server. |
| `CMD_LDAP_BINDCREDENTIALS` | `ldap.bindCredentials` | _no example_ | The credentials (password) for the account that CodiMD is using. |
| `CMD_LDAP_SEARCHBASE` | `ldap.searchBase` | `ou=users,dc=example,dc=com` | The LDAP directory to begin the search from. |
| `CMD_LDAP_SEARCHFILTER` | `ldap.searchFilter` | `(uid={{username}})` | The LDAP filter that will be used to find the matching username. Use `{{username}}` as placeholder for the username (entered in login dialog). |
| `CMD_LDAP_SEARCHATTRIBUTES` | `ldap.searchAttributes` | `displayName, mail` | The LDAP attributes that will be searched with. Multiple values are separated with a comma. |
| `CMD_LDAP_USERIDFIELD` | `ldap.useridField` | `uidNumber`, `uid` or `sAMAccountName` | The LDAP field which is used to  uniquely identify a user on CodiMD. |
| `CMD_LDAP_USERNAMEFIELD` | `ldap.usernameField` | _Fallback to userid_ | The LDAP field which is used as the username on CodiMD. |
| `CMD_LDAP_TLS_CA` | `ldap.tlsca` | `server-cert.pem, root.pem` | Root CA certificates for LDAP TLS in PEM format (use commas to separate). |


### OAuth2 Login
Refer to the guides for [Mattermost](/guides/auth/mattermost-self-hosted.md) and [Nextcloud](/guides/auth/nextcloud.md) as examples.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_OAUTH2_PROVIDERNAME` | `oauth2.providerName` | `My institution` | Optional name to be displayed at login form indicating the oAuth2 provider. |
| `CMD_OAUTH2_AUTHORIZATION_URL` | `oauth2.authorizationURL` | `https://example.com/oauth2/authorize` | The authorization URL of your OAuth2 provider. |
| `CMD_OAUTH2_TOKEN_URL` | `oauth2.tokenURL` | `https://example.com/oauth2/access_token` | The token endpoint of your OAuth2 provider. |
| `CMD_OAUTH2_CLIENT_ID` | `oauth2.clientID` | `afae02fckafd...` | The client ID you received from your OAuth2 provider for your CodiMD instance. |
| `CMD_OAUTH2_CLIENT_SECRET` | `oauth2.clientSecret` | `afae02fckafd...` | The secret for the client ID you received from your OAuth2 provider. |


### SAML Login
Refer to the [SAML guide](/guides/auth/saml.md) for more information or the [OneLogin guide](/guides/auth/saml-onelogin.md) as example.

| variable | config file property | example value | description |
| -------- | -------------------- | ------------- | ----------- |
| `CMD_SAML_IDPSSOURL` | `saml.idpSsoUrl` | `https://idp.example.com/sso` | The login URL for the SAML identity provider. |
| `CMD_SAML_IDPCERT` | `saml.idpCert` | `/path/to/cert.pem` | Path to the certificate file of the IdP in PEM format. |
| `CMD_SAML_ISSUER` | `saml.issuer` | _no example_ | The issuer name to supply to identity provider (optional, default: `serverURL`). |
| `CMD_SAML_IDENTIFIERFORMAT` | `saml.identifierFormat` | _no example_ | The SAML identity provider format (optional, default: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`). |
| `CMD_SAML_DISABLEREQUESTEDAUTHNCONTEXT` | `saml.disableRequestedAuthnContext` | `true` or `false` | If set to `true`, no specific authentication context is requested. This is known to help when authenticating against Active Directory (AD FS) servers. |
| `CMD_SAML_GROUPATTRIBUTE` | `saml.groupAttribute` | `memberOf` | The name of the attribute to use for listing the groups of the user (optional). |
| `CMD_SAML_EXTERNALGROUPS` | `saml.externalGroups` | `guests` | List of group names that are _not_ allowed to log in (pipe separated, optional). |
| `CMD_SAML_REQUIREDGROUPS` | `saml.requiredGroups` | `codimd-users\|admins` | List of group names that are allowed to log in (pipe separated, optional). |
| `CMD_SAML_ATTRIBUTE_ID` | `saml.attribute.id` | `sAMAccountName` | The attribute to use as a unique user identifier. |
| `CMD_SAML_ATTRIBUTE_USERNAME` | `saml.attribute.username` | `mailNickname` | The attribute to use as the username. |
| `CMD_SAML_ATTRIBUTE_EMAIL` | `saml.attribute.email` | `mail` | The attribute to use as the user's email address. |
