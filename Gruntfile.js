var config, path;

path = require('path');

config = function(grunt) {
  grunt_config = {
    babel: {
      options: {
        sourceMap: false,
        presets: ['@babel/preset-react']
      },
      dist: {
        files: [{
          expand: true,
          cwd: './assets/javascripts/app/components',
          src: ['*.jsx'],
          dest: './assets/javascripts/app/components',
          ext: '.js'
        }]
      }
    },
    clean: {
      "default": {
        options: {
          "no-write": true
        },
        src: ["!www/config.xml", "www/*"]
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'assets/public/',
            src: ['cordova.html'],
            dest: 'www'
          }
        ]
      },
      img: {
        files: [
          {
            expand: true,
            cwd: 'assets/img/',
            src: ['**/*'],
            dest: 'www/img/'
          }
        ]
      },
      css: {
        files: [
          {
            expand: true,
            cwd: 'assets/stylesheets',
            src: ['**/*.css'],
            dest: 'www/css'
          },
          {
            expand: true,
            cwd: 'bower_components/bootstrap/dist/css/',
            src: ['bootstrap.css'],
            dest: 'www/css'
          }
        ]
      },
      js: {
        files: [
          {
            expand: true,
            cwd: './bower_components/persistence/lib',
            src: ['persistence.js'],
            dest: 'www/js'
          },
          {
            expand: true,
            cwd: './assets/javascripts/database',
            src: ['persistence.store.cordovasql.js', 'persistence.store.sqlcipher.js'],
            dest: 'www/js'
          }
        ]
      }
    },
    less: {
      compile: {
        options: {
          paths: ['assets/stylesheets']
        },
        files: {
          'www/css/main.css': 'assets/stylesheets/main.less'
        }
      }
    },
    cssmin: {
      compress: {
        files: {
          'www/css/main.css': [
            'bower_components/bootstrap/dist/css/bootstrap.css', 
            'www/css/main.css'
          ]
        },
        options: {
          keepSpecialComments: 0
        }
      }
    },
    requirejs: {
      cordova: {
        options: {
          mainConfigFile: 'assets/javascripts/app/require_config.js',
          out: 'www/js/cordova.js',
          uglify: {
            toplevel: true,
            ascii_only: true,
            beautify: true,
            max_line_length: 1000,
            defines: {
              DEBUG: ['name', 'true']
            },
            no_mangle: true
          },
          wrap: false,
          almond: true,
          preserveLicenseComments: false,
          output: {
            beautify: true
          },
          compress: {
            sequences: false,
            global_defs: {
              DEBUG: true
            }
          },
          warnings: true,
          mangle: false,
        }
      }
    },
    watch: {
      js: {
        files: ['assets/javascripts/**/*'],
        tasks: ['copy:js']
      },
      less: {
        files: ['assets/stylesheets/**/*.less'],
        tasks: ['less'],
        options: {
          spawn: true
        }
      },
      img: {
        files: ['assets/img/**/*'],
        tasks: ['copy:img']
      },
      htmlbuild: {
        files: ['assets/public/**/*.html'],
        tasks: ['htmlbuild']
      }
    }
  };

  // Required files for application to work
  required_js_files = [ ]

  var paths = {}
  var includes = []
  var cwd = process.cwd();

  for(i=0; i<required_js_files.length; i++){
    file_def = required_js_files[i]
    new_file_path = file_def.prefix+"/"+file_def.module_name
    grunt.log.writeln(new_file_path)
    grunt.log.writeln(file_def.path);
    grunt.log.writeln(cwd+"/assets/javascripts/app/"+new_file_path);
    grunt.log.writeln()
    var writableContents = grunt.file.read(file_def.path);
    grunt.file.write("assets/javascripts/app/"+new_file_path+".js", writableContents);
    paths[new_file_path] = cwd+"/assets/javascripts/app/"+new_file_path;
    includes.push(new_file_path);
  }

  paths["user_db_migrations"] = cwd+"/assets/javascripts/database/user_db_migrations";
  paths["app_db_migrations"] = cwd+"/assets/javascripts/database/app_db_migrations";
  includes.push("user_db_migrations");
  includes.push("app_db_migrations");

  grunt_config.requirejs.cordova.options["paths"] = paths;
  grunt_config.requirejs.cordova.options["include"] = includes;

  grunt.log.writeln();
  grunt.log.writeln();

  return grunt_config;
};

module.exports = function(grunt) {
  grunt.initConfig(config(grunt));
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['babel', 'copy', 'requirejs', 'less', 'cssmin']);
};