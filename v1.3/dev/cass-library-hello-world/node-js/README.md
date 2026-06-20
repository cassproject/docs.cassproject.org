# Node.js
This guide will walk you through the basics of using some features of the CaSS library in Node.js. This guide assumes you have installed and configured [Node.js/NPM](https://nodejs.org/).

Links for distributions of the library may be found in the [Links](/dev/links-and-references/) page inside the developer guide.


1. Open a shell/command prompt with Node configured in the path.

2. Navigate to a new or existing working directory.

3. Perform a global installation first (this installs some libraries using node-gyp):
    ```bash
    npm install cassproject
    ```

4. Next, in a script or the node interactive shell:
    ```js
    require("cassproject");
    EcRemote.async = false; // This will force code to run synchronously.
    ```

5. To test things out, paste the following:
    ```js
    EcFramework.get(
        "https://sandbox.cassproject.org/api/custom/data/schema.cassproject.org.0.2.Framework/ce4c0e41-f24c-407d-95af-047bfee429bf",

        function(framework) {
            console.log(framework.name);
        },

        function(error) {
            console.log(error);
        }
    );

    EcCompetency.get(
        "https://sandbox.cassproject.org/api/custom/data/schema.cassproject.org.0.2.Competency/onet:1.A.1",

        function(competency){
            console.log(competency.name);
        },

        function(error){
            console.log(error);
        }
    );
    ```

6. If you get the names output to the console, you’re ready to go. Check out the other guides for more information.

For more, check out the [JavaScript Tutorial](../javascript/).