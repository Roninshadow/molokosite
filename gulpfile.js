'use strict'

const { src, dest } = require('gulp')
const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const cssbeautify = require('gulp-cssbeautify')
const removeComments = require('gulp-strip-css-comments')
const rename = require('gulp-rename')
const sass = require('gulp-sass')(require('sass'))
const cssnano = require('gulp-cssnano')
const uglify = require('gulp-uglify')
const plumber = require('gulp-plumber')
const panini = require('panini')
const del = require('del')
const notify = require('gulp-notify')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const browserSync = require('browser-sync').create()
const svgSprite = require('gulp-svg-sprite')
const svgo = require('gulp-svgo')
const cheerio = require('gulp-cheerio')
const through = require('through2')
const fs = require('fs')
const path = require('path')

/* Paths */
const srcPath = 'src/'
const distPath = 'dist/'

// НАСТРОЙКИ ПУТЕЙ ДЛЯ HTML И SCSS
const htmlWatchPath = srcPath + 'partials/*.html' // Папка для отслеживания HTML
const scssOutputPath = srcPath + 'assets/scss/' // Папка для сохранения SCSS

const paths = {
	build: {
		html: distPath,
		js: distPath + 'assets/js/',
		css: distPath + 'assets/css/',
		images: distPath + 'assets/images/',
		fonts: distPath + 'assets/fonts/',
		svg: distPath + 'assets/svg/',
	},
	src: {
		html: srcPath + '*.html',
		js: srcPath + 'assets/js/*.js',
		css: srcPath + 'assets/scss/*.scss',
		images: srcPath + 'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
		fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}',
		svg: srcPath + 'assets/svg/*.svg',
	},
	watch: {
		html: htmlWatchPath, // Используем новую папку для отслеживания HTML
		js: srcPath + 'assets/js/**/*.js',
		css: srcPath + 'assets/scss/**/*.scss',
		images: srcPath + 'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
		fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}',
		svg: srcPath + 'assets/svg/*.svg',
	},
	clean: './' + distPath + '**/*', // Удаляем только содержимое dist
}

/* Tasks */

// Функция создания SCSS-файла
function createScssFile(htmlPath) {
	// Получаем имя файла без расширения
	const fileName = path.basename(htmlPath, path.extname(htmlPath))

	// Пропускаем файлы с префиксом _
	if (fileName.startsWith('_')) {
		console.log(`Пропуск файла с префиксом _: ${fileName}.html`)
		return
	}

	// Формируем путь для нового SCSS-файла (используем новую папку)
	const scssPath = path.join(scssOutputPath, `${fileName}.scss`)

	// Проверяем существование файла
	if (fs.existsSync(scssPath)) {
		console.log(`SCSS-файл уже существует: ${scssPath}`)
		return
	}

	// Создаем базовое содержимое для SCSS-файла
	const content = `/* Стили для страницы ${fileName} */\n\n`

	// Убеждаемся, что папка существует
	if (!fs.existsSync(scssOutputPath)) {
		fs.mkdirSync(scssOutputPath, { recursive: true })
	}

	// Записываем файл
	fs.writeFileSync(scssPath, content)
	console.log(`Создан файл: ${scssPath}`)
}

// Задача для обработки существующих HTML-файлов
function processExistingHtml(cb) {
	// Проверяем существует ли папка с HTML
	if (!fs.existsSync(path.dirname(htmlWatchPath))) {
		console.log('Папка для HTML не существует')
		return cb()
	}

	// Получаем все HTML файлы в указанной папке
	const htmlFiles = fs
		.readdirSync(path.dirname(htmlWatchPath))
		.filter(file => path.extname(file) === '.html' && !file.startsWith('_'))

	// Создаем SCSS файлы для каждого HTML
	htmlFiles.forEach(file => {
		createScssFile(path.join(path.dirname(htmlWatchPath), file))
	})

	cb()
}

// Задача для отслеживания новых HTML-файлов
function watchNewHtml() {
	return gulp.watch(htmlWatchPath, file => {
		if (file.type === 'added' && path.extname(file.path) === '.html') {
			createScssFile(file.path)
		}
	})
}

// Новая задача: удаление всех CSS файлов кроме style.min.css
function cleanCssExceptStyleMin() {
	return del([paths.build.css + '**/*', '!' + paths.build.css, '!' + paths.build.css + 'style.min.css'])
}

function serve() {
	browserSync.init({
		server: {
			baseDir: './' + distPath,
		},
	})
}

function html(cb) {
	panini.refresh()
	return src(paths.src.html, { base: srcPath })
		.pipe(plumber())
		.pipe(
			panini({
				root: srcPath,
				layouts: srcPath + 'layouts/',
				partials: srcPath + 'partials/',
				helpers: srcPath + 'helpers/',
				data: srcPath + 'data/',
			})
		)
		.pipe(dest(paths.build.html))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function css(cb) {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.css)) {
		fs.mkdirSync(paths.build.css, { recursive: true })
	}

	return src(paths.src.css, { base: srcPath + 'assets/scss/' })
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'SCSS Error',
						message: 'Error: <%= error.message %>',
					})(err)
					this.emit('end')
				},
			})
		)
		.pipe(
			sass({
				includePaths: './node_modules/',
			})
		)
		.pipe(
			autoprefixer({
				cascade: true,
			})
		)
		.pipe(cssbeautify())
		.pipe(dest(paths.build.css))
		.pipe(
			cssnano({
				zindex: false,
				discardComments: {
					removeAll: true,
				},
			})
		)
		.pipe(removeComments())
		.pipe(
			rename({
				suffix: '.min',
				extname: '.css',
			})
		)
		.pipe(dest(paths.build.css))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function sprite() {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.svg)) {
		fs.mkdirSync(paths.build.svg, { recursive: true })
	}

	const config = {
		mode: {
			symbol: {
				inline: true,
				dest: '.',
				sprite: 'sprite.svg',
				example: false,
			},
		},
		shape: {
			id: {
				generator: 'icon-%s',
			},
			transform: [
				{
					svgo: {
						plugins: [
							{ name: 'removeTitle', active: true },
							{ name: 'removeDesc', active: true },
							{ name: 'removeUselessDefs', active: true },
							{ name: 'removeViewBox', active: false },
						],
					},
				},
			],
		},
		svg: {
			xmlDeclaration: false,
			doctypeDeclaration: false,
		},
	}

	return src(paths.src.svg)
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'SVG Sprite Error',
						message: 'Error: <%= error.message %>',
					})(err)
					this.emit('end')
				},
			})
		)
		.pipe(svgSprite(config))
		.pipe(dest(paths.build.svg))
		.pipe(browserSync.reload({ stream: true }))
}

function cssWatch(cb) {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.css)) {
		fs.mkdirSync(paths.build.css, { recursive: true })
	}

	return src(paths.src.css, { base: srcPath + 'assets/scss/' })
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'SCSS Error',
						message: 'Error: <%= error.message %>',
					})(err)
					this.emit('end')
				},
			})
		)
		.pipe(
			sass({
				includePaths: './node_modules/',
			})
		)
		.pipe(
			rename({
				suffix: '.min',
				extname: '.css',
			})
		)
		.pipe(dest(paths.build.css))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function js(cb) {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.js)) {
		fs.mkdirSync(paths.build.js, { recursive: true })
	}

	return src(paths.src.js, { base: srcPath + 'assets/js/' })
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'JS Error',
						message: 'Error: <%= error.message %>',
					})(err)
					this.emit('end')
				},
			})
		)
		.pipe(
			webpackStream({
				mode: 'production',
				output: {
					filename: 'app.js',
				},
			})
		)
		.pipe(dest(paths.build.js))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function jsWatch(cb) {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.js)) {
		fs.mkdirSync(paths.build.js, { recursive: true })
	}

	return src(paths.src.js, { base: srcPath + 'assets/js/' })
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'JS Error',
						message: 'Error: <%= error.message %>',
					})(err)
					this.emit('end')
				},
			})
		)
		.pipe(
			webpackStream({
				mode: 'development',
				output: {
					filename: 'app.js',
				},
			})
		)
		.pipe(dest(paths.build.js))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function images(cb) {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.images)) {
		fs.mkdirSync(paths.build.images, { recursive: true })
	}

	return src(paths.src.images)
		.pipe(dest(paths.build.images))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function fonts(cb) {
	// Убеждаемся, что папка назначения существует
	if (!fs.existsSync(paths.build.fonts)) {
		fs.mkdirSync(paths.build.fonts, { recursive: true })
	}

	return src(paths.src.fonts)
		.pipe(dest(paths.build.fonts))
		.pipe(browserSync.reload({ stream: true }))

	cb()
}

function clean(cb) {
	return del([paths.clean]) // Удаляем только содержимое dist
	cb()
}

function watchFiles() {
	gulp.watch([paths.watch.html], html)
	gulp.watch([paths.watch.css], cssWatch)
	gulp.watch([paths.watch.js], jsWatch)
	gulp.watch([paths.watch.images], images)
	gulp.watch([paths.watch.fonts], fonts)
	gulp.watch([paths.watch.svg], gulp.series(sprite, html))
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts, sprite))
const watch = gulp.parallel(build, watchFiles, serve, processExistingHtml, watchNewHtml)

/* Exports Tasks */
exports.html = html
exports.css = css
exports.js = js
exports.images = images
exports.fonts = fonts
exports.clean = clean
exports.sprite = sprite
exports.build = build
exports.watch = watch
// Экспортируем новую задачу
exports.cleanCss = cleanCssExceptStyleMin
exports.default = watch
