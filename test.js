require('enable-mobile')
const Spectrum = require('./gl');
const isBrowser = require('is-browser');
const db = require('decibels');
const colormap = require('colormap');
const colorScales = require('colormap/colorScales');
const appAudio = require('app-audio');
const ctx = require('audio-context');
const insertCss =  require('insert-styles');
const isMobile = require('is-mobile')();
const Color = require('tinycolor2');
const createFps = require('fps-indicator');
const createSettings = require('settings-panel')
const theme = require('settings-panel/theme/typer')
const fft = require('fourier-transform');
const alpha = require('color-alpha');
const blackman = require('scijs-window-functions/blackman-harris');
let palettes = require('nice-color-palettes');
// require('get-float-time-domain-data');


let colormaps = {};

for (var name in colorScales) {
	if (name === 'alpha') continue;
	if (name === 'hsv') continue;
	if (name === 'rainbow') continue;
	if (name === 'rainbow-soft') continue;
	if (name === 'phase') continue;

	colormaps[name] = colormap({
		colormap: colorScales[name],
		nshades: 16,
		format: 'rgbaString'
	});
	palettes.push(colormaps[name]);
}

palettes = palettes
//filter not readable palettes
.filter((palette) => {
	return Color.isReadable(palette[0], palette.slice(-1)[0], {
		level:"AA", size:"large"
	});
});


insertCss(`
	select option {
		-webkit-appearance: none;
		appearance: none;
		display: block;
		background: white;
		position: absolute;
	}
`);


//show framerate
let fps = createFps();
fps.element.style.color = theme.palette[0];
fps.element.style.fontFamily = theme.fontFamily;
fps.element.style.fontWeight = 500;
fps.element.style.fontSize = '12px';
fps.element.style.marginTop = '1rem';
fps.element.style.marginRight = '1rem';



var analyser;
var audio = appAudio({
	context: ctx,
	token: '6b7ae5b9df6a0eb3fcca34cc3bb0ef14',
	// source: './Liwei.mp3',
	// source: 'https://soundcloud.com/wooded-events/wooded-podcast-cinthie',
	// source: 'https://soundcloud.com/compost/cbls-362-compost-black-label-sessions-tom-burclay',
	// source: isMobile ? './sample.mp3' : 'https://soundcloud.com/vertvrecords/trailer-mad-rey-hotel-la-chapelle-mp3-128kbit-s',
	// source: isMobile ? './sample.mp3' : 'https://soundcloud.com/robbabicz/rbabicz-lavander-and-the-firefly',
	// source: 'https://soundcloud.com/einmusik/einmusik-live-watergate-4th-may-2016',
	// source: 'https://soundcloud.com/when-we-dip/atish-mark-slee-manjumasi-mix-when-we-dip-062',
	// source: 'https://soundcloud.com/dark-textures/dt-darkambients-4',
	// source: 'https://soundcloud.com/deep-house-amsterdam/diynamic-festival-podcast-by-kollektiv-turmstrasse',
	source: 'https://soundcloud.com/harperaudio_us/tatiana-and-alexander-by-paullina-simons'
}).on('load', (node) => {
	analyser = audio.context.createAnalyser();
	analyser.smoothingTimeConstant = 0.2;
	analyser.fftSize = 1024;
	analyser.minDecibels = -100;
	analyser.maxDecibels = 0;

	node.disconnect();
	node.connect(analyser);
	analyser.connect(audio.context.destination);

	// setTimeout(upd, 100);
	// setTimeout(upd, 200);
	// setTimeout(upd, 300);
	// setTimeout(upd, 1000);
});

audio.element.style.fontFamily = theme.fontFamily;
audio.element.style.fontSize = theme.fontSize;
audio.update();




var spectrum = new Spectrum({
	// autostart: false,
	interactions: true,
	log: false,
	// align: .5,
	// fill: colormap,
	// grid: 0,
	minFrequency: 500,
	maxFrequency: 19000,
	// logarithmic: true,
	smoothing: .7,
	// maxDecibels: 0,
	align: 0.5,
	// trail: 38,
	trail: false,
	// autostart: false,
	//balance: .9,
	// antialias: true,
	// fill: [1,1,1,0],
	// fill: './images/stretch.png',
	type: 'line',
	// barWidth: 1,
	weighting: 'b',
	// background: [27/255,0/255,37/255, 1],
	//background: [1,0,0,1]//'./images/bg-small.jpg'
	// viewport: function (w, h) {
	// 	return [50,20,w-70,h-60];
	// }
}).on('render', upd)
spectrum.update({grid: false})

//spectrum.grid.update({x: {fontFamily: theme.fontFamily, fontSize: '10px'}});
// setInterval(upd, 100)


function upd () {
	if (!analyser) return;

	// var waveform = new Float32Array(analyser.fftSize);
	// analyser.getFloatTimeDomainData(waveform);

	// dbMagnitudes = fft(waveform.map((v, i) => v*blackman(i, waveform.length)));
	// dbMagnitudes = dbMagnitudes.map((f, i) => db.fromGain(f));

	var dbMagnitudes = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(dbMagnitudes);

	spectrum.set(dbMagnitudes);
}

// spectrum.render();

// createColormapSelector(spectrum);

// test('line webgl');
// test('bars 2d');
// test('node');
// test('viewport');
// test('clannels');
// test('classic');
// test('bars');
// test('bars line');
// test('dots');
// test('dots line');
// test('colormap (heatmap)');
// test('multilayered (max values)');
// test('line');
// test('oscilloscope');

let settings = createSettings([
	{id: 'type', type: 'select', options: ['line', 'bar', 'fill'], value: spectrum.type, change: v => spectrum.update({type: v})},
	// {id: 'align', label: '↕', title: 'align', type: 'range', min: 0, max: 1, value: spectrum.align, change: v => spectrum.update({align: v})},
	// {id: 'smoothing', label: '~', title: 'smoothing', type: 'range', min: 0, max: 1, value: spectrum.smoothing, change: v => spectrum.update({smoothing: v})},
	{type: 'raw', label: 'palette', id: 'palette', style: ``, content: function (data) {
		let el = document.createElement('div');
		el.className = 'random-palette';
		el.style.cssText = `
			width: 1.5em;
			height: 1.5em;
			background-color: rgba(120,120,120,.2);
			margin-left: 0em;
			display: inline-block;
			vertical-align: middle;
			cursor: pointer;
		`;
		el.title = 'Randomize palette';
		let settings = this.panel;
		setColors(el, spectrum.palette, settings.theme.active);

		el.onclick = () => {
			// settings.set('colors', 'custom');
			let palette = palettes[Math.floor((palettes.length - 1) * Math.random())];

			if (Math.random() > .5) palette = palette.reverse();

			setColors(el, palette);
		}

		//create colors in the element
		function setColors(el, palette, active) {
			spectrum.update({
				background: palette.length > 1 ? palette[palette.length - 1] : 'white',
				palette: palette.slice().reverse()
			});

			let bg = palette.length > 1 ? spectrum.getColor(0.) : 'white';

			settings.update({
				style: `background-color: ${alpha(bg, .5)};
					box-shadow: 0 0 0 2px ${alpha(spectrum.getColor(0.5), .1)};`
			});
			if (palette.length > 1) {
				settings.update({
					palette: palette,
				});
			}

			audio.update({color: palette[0]});
			fps.element.style.color = spectrum.palette[palette.length-1];

			el.innerHTML = '';
			if (active) {
				palette = palette.slice();
				palette.unshift(active);
			}
			for (var i = 0; i < 3; i++) {
				let colorEl = document.createElement('div');
				el.appendChild(colorEl);
				colorEl.className = 'random-palette-color';
				colorEl.style.cssText = `
					width: 50%;
					height: 50%;
					float: left;
					background-color: ${palette[i] || 'transparent'}
				`;
			}
		}
		return el;
	}},
	{id: 'log', type: 'checkbox', value: spectrum.log, change: v => spectrum.update({log: v})
	},
	{id: 'grid', type: 'checkbox', value: spectrum.grid, change: v => spectrum.update({grid: v})
	},
	{id: 'weighting', label: 'weighting', title: 'Weighting', type: 'select', options: ['a', 'b', 'c', 'd', 'itu', 'z'],
		value: spectrum.weighting,
		change: (value) => {
			spectrum.update({weighting: value, trail: false})
		}
	},
	{id: 'trail', label: 'trail', type: 'checkbox', value: !!spectrum.trail, change: v => spectrum.update({trail: v})
	}
],{
	title: '<a href="https://github.com/audio-lab/gl-spectrum">gl-spectrum</a>',
	theme: theme,
	fontSize: 12,
	palette: ['black', 'white'],
	css: `
		:host {
			z-index: 1;
			position: fixed;
			left: 1rem;
			max-width: 100vw;
			white-space: nowrap;
			bottom: 2.5rem;
			width: auto;
			background-color: transparent;
			padding: .5rem 1rem;
		}
		.settings-panel-title {
			width: auto;
			display: inline-block;
			line-height: 1;
			padding: .5rem 0;
			vertical-align: baseline;
		}
		.settings-panel-field {
			width: auto;
			vertical-align: top;
			display: inline-block;
			margin-right: 0;
			margin-left: 1rem;
		}
		.settings-panel-label {
			width: auto!important;
		}
	`
});
