module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                "**/*.js",
                "!node_modules/**/*"
            ]
        },
        watch: {
            scripts: {
                files: [
                    "**/*.js",
                    "!build/**/*",
                    "!node_modules/**/*"
                ],
                tasks: ["jsbeautifier"],
                options: {
                    spawn: false,
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-jsbeautifier");

    grunt.registerTask("dev", ["watch"]);
    grunt.registerTask("jsb", ["jsbeautifier"]);
    grunt.registerTask("default", ["jsbeautifier"]);
};
