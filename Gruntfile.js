module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	grunt.initConfig({
		jshint: {
			all: [ 'lib/*.js', 'lib/**/*.js' ]
		},
		nodeunit: {
			tests: ['test/testGenerate.js', 'test/testReadModels.js']
		}
	});

	grunt.registerTask('default', ['jshint', 'nodeunit']);
};
