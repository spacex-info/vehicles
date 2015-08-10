module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    // Copy everything to build
    copy: {
      build: {
        cwd: "src",
        src: ["**"],
        dest: "build",
        expand: true
      },
      favicon: {
        src: ["src/img/favicon.ico"],
        dest: "build/favicon.ico"
      }
    },

    // Clean /dist
    clean: {
      build: {
        src: ["build"]
      },
      stylesheets: {
        src: ["build/**/*.css", "build/css", "!build/bundle.css"]
      },
      scripts: {
        src: ["build/**/*.js", "build/js", "!build/bundle.js"]
      },
      svg: {
        src: ["build/**/*.svg"]
      },
      templates: {
        src: ["build/template"]
      },
      vendor: {
        src: ["build/vendor"]
      },
    },

    // compile scss to css
    sass: {
      dist: {
        files: {
          "build/bundle.css" : "src/css/main.scss"
        }
      }
    },

    // Minify the CSS
    cssmin: {
      build: {
        files: {
          "build/bundle.css": ["build/bundle.css", "build/vendor/**/*.css"]
        }
      }
    },

    // Auto add vendor prefixes
    autoprefixer: {
      build: {
        expand: true,
        cwd: "build",
        src: [ "**/*.css" ],
        dest: "build"
      }
    },

    // Uglify the sourcecode
    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */ ",
        sourceMap: true
      },
      build: {
        src: "src/js/**/*.js",
        dest: "build/bundle.js"
      }
    },

    includereplace: {
      build: {
        src: "src/*.html",
        dest: "build/",
        flatten: true,
        cwd: ".",
        expand: true
      }
    },

    // svg2png
    svg2png: {
      all: {
        files: [
          {
            cwd: "src/vehicles/",
            src: ["**/*.svg"],
            dest: "build/vehicles/"
          }
        ]
      }
    },

    // Watch
    watch: {
      options: {
        livereload: true
      },
      stylesheets: {
        files: ["src/**/*.scss"],
        tasks: ["stylesheets"]
      },
      scripts: {
        files: "src/js/**/*.js",
        tasks: ["scripts"]
      },
      vehicles: {
        files: "src/vehicles/**/*.json",
        tasks: ["build"]
      },
      svg2png: {
        files: "src/vehicles/**/*.svg",
        tasks: ["build"]
      },
      includereplace: {
        files: ["src/**/*.html"],
        tasks: ["includereplace"]
      },
      
    },
    
    // Lint
    jshint: {
      options: {
        globals: [],
        browserify: true,
        jquery: true
      },
      files: ["Gruntfile.js", "src/js/**/*.js", "!src/js/libs/*.js"]
    },

    // Development Server
    connect: {
      server: {
        options: {
          port: 8080,
          base: "build",
          hostname: "localhost",
          livereload: true
        }
      }
    },
    
    // Beautify
    jsbeautifier : {
      files : ["src/js/**/*.js", "src/**/*.html"],
      options : {
        js: {
          indentSize: 2
        },
        
        html: {
          indentSize: 2
        }
      }
    }
    
  });
  
  require("load-grunt-tasks")(grunt);
  grunt.loadNpmTasks("grunt-svg2png");
  
  grunt.registerTask("stylesheets", "Compiles the stylesheets.",
                     ["sass", "autoprefixer", "cssmin", "clean:stylesheets"]);

  grunt.registerTask("templates",
                     "Compiles the HTML files.", ["includereplace", "clean:templates"]);
  
  grunt.registerTask("scripts",
                     "Compiles the JavaScript files.", ["jshint", "uglify", "clean:scripts"]);

  grunt.registerTask("build", "Compiles all of the assets and copies the files to the build directory.",
                     ["clean:build", "svg2png", "copy", "templates", "stylesheets", "scripts", "clean:vendor"]);
  
  grunt.registerTask("default", "Watches the project for changes, automatically builds them and runs a server.",
                     ["build", "connect", "watch" ]);
};
