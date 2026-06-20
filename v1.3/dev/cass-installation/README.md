# CaSS Installation

This is the installation guide for a CaSS instance. If you're just looking to work with an existing CaSS instance, you may be looking for the CaSS Library. See the [Links](/dev/links-and-references) section for more information.

## System Requirements
- 4 GB of ram (can work with 2 GB with additional configuration)
  - Tomcat: 512 MB (can be reduced to 256 MB)
  - ElasticSearch: 2 GB (can be reduced to 1 GB)
- At least 8 GB of hard drive space.

## CaSS Version Requirements
Minimum CaSS version selection for inclusion of CaSS Authoring Tools should be **1.3**

## CAT/CaSS Installation

### Linux (Debian, Ubuntu, Amazon and other Fedora derivatives)

CaSS can be installed on linux through our Bash install script.

Install and Upgrade

```bash
wget https://raw.githubusercontent.com/cassproject/CASS/master/scripts/cassInstall.sh
 chmod +x cassInstall.sh
 sudo ./cassInstall.sh
```

## Docker

Images for CASS are kept in Docker Hub under [cassproject/cass](https://hub.docker.com/r/cassproject/cass).

The following command will run the CaSS Standalone server with an interactive prompt and expose it on port 80 on the local machine.

```bash
docker run -it -p80:80 cassproject/cass
```

Additionally, if you wish to use docker-compose or some other means of deploying CaSS in a constellation of servers, see [this docker-compose file](https://github.com/cassproject/CASS/blob/master/docker-compose.yml).

## Windows

Windows installation uses [Chocolatey](https://chocolatey.org/) as a package manager. Chocolatey will be used to install all required CASS dependencies (maven, git, and elasticsearch).

If you would like to install these packages by hand or using another tool, please feel free.

[CASS Package on Chocolatey](https://chocolatey.org/packages/cass)

### Once

From an elevated powershell:

```batch
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
refreshenv
choco install -y cass
refreshenv
```

Go to services, start ```elasticsearch-service-x64``` and set it to start automatically.

### Install/Upgrade

From an elevated command line:
```batch
choco install -y cass
```

## Setup

- Set up a **DNS endpoint**
- Set up an **HTTPS certificate**
- Set up [IIS Reverse Proxy](https://weblogs.asp.net/owscott/creating-a-reverse-proxy-with-url-rewrite-for-iis)
  - Reverse Proxy Endpoint: ```https://<your cass domain>/ -> http://localhost:8080/cass/```
- In your firewall, deny access to ports ```9200``` and ```8080``` to all machines except localhost.


## Post-Installation Checklist

1. Ensure API is started and reachable through a desired endpoint
  1. (e.g. ```http://cass.<your_organization>.org/api/custom/```).
  2. Note that all objects created will use this endpoint in their permanent locator, so make sure!
2. Ensure Website is reachable through a desired endpoint
  1. (e.g. ```http://cass.<your_organization>.org/```).
  2. CASS attempts to auto-detect the endpoint for the Tomcat server automatically. XSS or obscure endpoints may require additional configuration.
3. Check your character encoding
  1. Look at the logfile (```<tomcat>/logs/*.log```) of when the server starts up, if the character set is not UTF-8, follow the FAQ instructions to force Tomcat/Java to use ```file.encoding=UTF-8```

## Testing, upgrade, and installation FAQ

1. Most errors will occur due to a lack of connectivity with the appropriate endpoint. Use the Browser Development Tools to ensure that requests are going to the correct location.
  1. Check to ensure the environment variable ```CASS_LOOPBACK``` is set to the endpoint of the server.
2. Apache requires proxy_http to function. If Apache fails to start up, the proxy_http module may not be enabled. In HTTPD, this is called ```mod_proxy_http```.
3. The installer will not modify a current install of the Apache/HTTPD Web Server if proxy settings are being used (even from a previous install).
4. When upgrading from 0.1.0 -- If you get the error `HTTP Status 404 - /cass-0.0.1/`
  1. Alter the apache conf files to use ProxyPass / ```http://localhost:8080/cass/```, not ProxyPass / ```http://localhost:8080/cass-0.0.1/```
5. On windows machines or machines where the default character encoding is not UTF-8, you will need to set a Tomcat Java parameter: ```-Dfile.encoding=UTF-8``` to avoid character encoding errors when dealing with unicode characters.
6. After an upgrade, database incompatibilities may occur. You may export and import data before upgrades using the following web services:
     * ```http://<endpoint>/skyrepo/util/backup?secret=[contents of skyId.secret in tomcat folder]```
     * ```http://<endpoint>/skyrepo/util/restore?secret=[contents of skyId.secret in tomcat folder]```

## Troubleshooting

1. **Is ElasticSearch running?**
    * If not, start it manually and ensure the service is configured to start automatically on boot.
2. **Is Tomcat running?**
    * If not, start it manually and ensure the service is configured to start automatically on boot.
3. **Can you access ```http://<server ip>:8080/cass/```?**
    * Make sure there are no conflicts on port 8080.
    * Verify that Tomcat is running.
    * Occasionally, Tomcat begins to deploy a WAR that is in the process of being copied. To correct this issue: Stop Tomcat, delete the CASS webapps directory (tomcat/webapps/cass), and restart Tomcat.
4. **Can you access ```http://<server ip>:8080/cass/api/``` with a response “Service does not exist”?**
    * If the request hangs, ensure ElasticSearch is running and that it started without error (check the logs).
5. **Can you access ```http://<server ip>:8080/cass/api/data?q=*``` and receive a valid response (empty list or data array depending on the data in the system)?**
    * If the request hangs, ensure ElasticSearch is running and that it started without error (check the logs).
6. **Access your local CASS installation via browser ```http://<server ip>:8080/cass/```, create a new user, and attempt to login.**
    * Did the login complete?
    * Did the user icon in the top right corner turn green?
    * Did you gain new capabilities? (Framework->New, Edit, etc)
    * If not, repeat the operations with browser developer tools enabled.  Watch the network stream and ensure the ‘login’, ‘create’, and ‘commit’ requests and responses are occurring without incident.
7. **Create a framework.**
    * Did it appear on the screen?
        * If not, repeat the operation with browser developer tools enabled.  Watch the network stream and ensure the framework creation POST occurred without incident.
8. **Create a competency in the framework.**
    * Did it appear in the framework?
        * If not, repeat the operation with browser developer tools enabled.  Watch the network stream and ensure the competency creation POST occurred without incident.
    * Delete the competency and framework.
9. **Can you access ```https://<server endpoint>/``` and view the website?**
    * If not, can you access ```http://<server endpoint>/``` (http vs. https) and view the website?
        * If so, verify the reverse proxy settings are applied to the HTTPS configuration.
        * If not, ensure the Apache2 server (or IIS) is working correctly (check the logs, debug the reverse proxy, etc.).
10. **Can you access ```https://<server endpoint>/api/ ```and get “Service does not exist”?**
    * If not, ensure the Apache2 server (or IIS) is working correctly (check the logs, debug the reverse proxy, etc.).
11. **Can you log into the CASS Manager and change the server to your endpoint (Login->Change Server)?**
    * If not, repeat the operation with browser developer tools enabled and look for the CORS headers.
        * If the CORS headers are not present, you may have to set them in Apache configuration or the reverse proxy.
