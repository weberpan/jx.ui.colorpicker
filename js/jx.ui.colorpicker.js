/**
 * 拾色器模块
 * 参考自 https://github.com/xaguilars/bootstrap-colorpicker
 * @author weberpan
 */

Jx().$package(function (J) {
	var $D = J.dom,
		$E = J.event,
		$ = $D.mini;

	J.ui = J.ui || {};
	J.ui.Color = new J.Class({
		init : function(value){
			this.value = {	//默认：白色
				h : 1,
				s : 0,
				b : 1,
				a : 1
			};
			value && this.setColor(value);
		},

		setColor : function(value){
			value = value.toLowerCase();
			var This = this;
			for(var i = CPGlobal.stringParsers.length; i--;){
				var parse = CPGlobal.stringParsers[i],
					match = parse.re.exec(value),
					values= match &&  parse.parse(match),
					space = parse.space && 'rgba';
				if (values) {
					if (space === 'hsla') {
						that.value = CPGlobal.RGBtoHSB(CPGlobal.HSLtoRGB(values));
					} else {
						that.value = CPGlobal.RGBtoHSB(values);
					}
				}
			}
		},

		setHue: function(h) {
			this.value.h = 1- h;
		},
		
		setSaturation: function(s) {
			this.value.s = s;
		},
		
		setLightness: function(b) {
			this.value.b = 1- b;
		},
		
		setAlpha: function(a) {
			this.value.a = parseInt((1 - a)*100, 10)/100;
		},

		// HSBtoRGB from RaphaelJS
		// https://github.com/DmitryBaranovskiy/raphael/
		toRGB: function(h, s, b, a) {
			if (!h) {
				h = this.value.h;
				s = this.value.s;
				b = this.value.b;
			}
			h *= 360;
			var R, G, B, X, C;
			h = (h % 360) / 60;
			C = b * s;
			X = C * (1 - Math.abs(h % 2 - 1));
			R = G = B = b - C;

			h = ~~h;
			R += [C, X, 0, 0, X, C][h];
			G += [X, C, C, X, 0, 0][h];
			B += [0, 0, X, C, C, X][h];
			return {
				r: Math.round(R*255),
				g: Math.round(G*255),
				b: Math.round(B*255),
				a: a||this.value.a
			};
		},
		
		toHex: function(h, s, b, a){
			var rgb = this.toRGB(h, s, b, a);
			return '#'+((1 << 24) | (parseInt(rgb.r) << 16) | (parseInt(rgb.g) << 8) | parseInt(rgb.b)).toString(16).substr(1);
		},
		
		toHSL: function(h, s, b, a){
			if (!h) {
				h = this.value.h;
				s = this.value.s;
				b = this.value.b;
			}
			var H = h,
				L = (2 - s) * b,
				S = s * b;
			if (L > 0 && L <= 1) {
				S /= L;
			} else {
				S /= 2 - L;
			}
			L /= 2;
			if (S > 1) {
				S = 1;
			}
			return {
				h: H,
				s: S,
				l: L,
				a: a||this.value.a
			};
		}
	});

	J.ui.ColorPicker = new J.Class({
		init : function(element, options){
			var format = typeof options === 'string'?
				options: options && options.format || 'hex';
			this.element = element;
			this.format  = CPGlobal.translateFormats[format];
			this.isInput = element.tagName === 'INPUT';
			this.component = $D.hasClass('input-append') || $D.hasClass('input-prepend')?
				$('.add-on', this.element)[0] : false;	//适配bootstrap的组合组件

			// 重新定义事件响应函数，达到绑定this的目的
			this.show = J.bind(this.show, this);
			this.hide = J.bind(this.hide, this);
			this.update = J.bind(this.update, this);
			this.place = J.bind(this.place, this);
			this.mousedown = J.bind(this.mousedown, this);
			this.mousemove = J.bind(this.mousemove, this);
			this.mouseup = J.bind(this.mouseup, this);

			this.picker = $D.xnode(CPGlobal.template);
			document.body.appendChild(this.picker);
			$E.on(this.picker, 'mousedown', this.mousedown);

			if (this.isInput) {
				$E.on(this.element, 'focus', this.show);
				$E.on(this.element, 'keyup', this.update);
			} else if (this.component) {
				$E.on(this.component, 'click', this.show);
			} else {
				$E.on(this.element, 'click', this.show);
			}

			if (format === 'rgba' || format === 'hsla') {
				$D.addClass(this.picker, 'alpha');
				this.alpha = $('.colorpicker-alpha', this.picker)[0].style;
			}

			if (this.component) {
				$('.colorpicker-color', this.picker)[0].style.display = 'none';
				this.preview = $('i', this.element)[0].style;
			} else {
				this.preview = $('.colorpicker-color>div', this.picker)[0].style;
			}

			this.base = $('.colorpicker-saturation', this.picker)[0].style;
			this.update();
		},

		//注：相比bootstrap-colorpicker源代码，此处事件响应暂时没有事件通知功能
		show : function(e) {
			this.picker.style.display = 'block';
			this.height = this.component? this.component.offsetHeight: this.element.offsetHeight;
			this.place();
			$E.on(window, 'resize', this.place);
			if (!this.isInput) {
				if (e) {
					e.stopPropagation();
					e.preventDefault();
				}
			}
			$E.on(document, 'mousedown', this.hide);
		},

		hide : function(e){
			this.picker.style.display = 'none';
			$E.off(window, 'resize', this.place);
			$E.off(document, 'mousedown', this.hide);
			//写入值
			var value = this.format.call(this);
			if (this.isInput) {
				//如果文本框是空的，则不做任何设置
				if (this.element.value) {
					this.element.value = value;
				}
			} else {
				if (this.component) {
					$('input', this.element)[0].value = value;
				}
				this.element.setAttribute('color', value);
			}
		},

		place : function(){
			var rect = this.component? this.component.getBoundingClientRect(): this.element.getBoundingClientRect();
			this.picker.style.cssText += 'left:' + rect.left + 'px;top:' + (rect.top + this.height) + 'px;';
		},

		update : function(){
			this.color = new J.ui.Color(this.isInput?
					this.element.value: this.element.getAttribute('color'));
			var list = $('i', this.picker);
			list[0].style.cssText += 'left:' + (this.color.value.s*100) + 'px;' + 
				'top:' + (100 - this.color.value.b*100) + 'px';
			list[1].style.top = (100 * (1 - this.color.value.h)) + 'px';
			list[2].style.left= (100 * (1 - this.color.value.a)) + 'px';
			this.previewColor();
		},

		previewColor : function(){
			var color;
			try {
				color = this.preview.backgroundColor = this.format.call(this);
			} catch(e) {
				color = this.preview.backgroundColor = this.color.toHex();
			}
			this.base.backgroundColor = this.color.toHex(this.color.value.h, 1, 1, 1);
			if (this.alpha) {
				this.alpha.backgroundColor = color;
			}
		},

		mousedown : function(e){
			e.stopPropagation();
			e.preventDefault();

			var target = e.target;
			while(target.tagName !== 'DIV' && target !== this.picker) {
				target = target.parentNode;
			}
			if (target !== this.picker) {
				if ($D.hasClass(target, 'colorpicker-saturation')) {
					this.slider = J.extend({}, CPGlobal.sliders.saturation);
				} else if ($D.hasClass(target, 'colorpicker-hue')) {
					this.slider = J.extend({}, CPGlobal.sliders.hue);
				} else if ($D.hasClass(target, 'colorpicker-alpha')) {
					this.slider = J.extend({}, CPGlobal.sliders.alpha);
				} else {
					return false;
				}
				var rect = target.getBoundingClientRect();
				this.slider.knob = $('i', target)[0].style;
				this.slider.left = e.pageX - rect.left;
				this.slider.top  = e.pageY - rect.top;
				this.pointer = {
					left : e.pageX,
					top  : e.pageY
				};

				//绑定拖动事件
				$E.on(document, 'mousemove', this.mousemove);
				$E.on(document, 'mouseup', this.mouseup);
				this.mousemove(e);
			}
			return false;
		},

		mousemove : function(e){
			e.stopPropagation();
			e.preventDefault();

			var left = Math.max(
				0,
				Math.min(
					this.slider.maxLeft,
					this.slider.left + e.pageX - this.pointer.left
				)
			);
			var top = Math.max(
				0,
				Math.min(
					this.slider.maxTop,
					this.slider.top + e.pageY - this.pointer.top
				)
			);
			this.slider.knob.cssText += 'left: ' + left + 'px;top:' + top + 'px;';
			if (this.slider.callLeft) {
				this.color[this.slider.callLeft].call(this.color, left / 100);
			}
			if (this.slider.callTop) {
				this.color[this.slider.callTop].call(this.color, top / 100);
			}
			this.previewColor();

			//鼠标移动时设置颜色值
			try {
				this.element.value = this.format.call(this);
			} catch(e) {
				this.element.value = this.color.toHex();
			}

			return false;
		},

		mouseup : function(e){
			e.stopPropagation();
			e.preventDefault();
			$E.off(document, 'mousemove', this.mousemove);
			$E.off(document, 'mouseup', this.mouseup);
			return false;
		}
	});

	var CPGlobal = {

		//将Color对象转换为字符串
		translateFormats : {
			'rgb' : function(){
				var rgb = this.color.toRGB();
				return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
			},

			'rgba' : function(){
				var rgb = this.color.toRGB();
				return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')';
			},

			'hsl' : function(){
				var hsl = this.color.toHSL();
				return 'hsl(' + Math.round(hsl.h*360) + ',' + Math.round(hsl.s*100) + '%,' + Math.round(hsl.l*100) + '%)';
			},

			'hsla' : function(){
				var hsl = this.color.toHSL();
				return 'hsla(' + Math.round(hsl.h*360) + ',' + Math.round(hsl.s*100) + '%,' + Math.round(hsl.l*100) + '%,' + hsl.a + ')';
			},

			'hex' : function(){
				return this.color.toHex();
			}
		},

		sliders : {
			saturation : {
				maxLeft : 100,
				maxTop : 100,
				callLeft : 'setSaturation',
				callTop : 'setLightness'
			},

			hue: {
				maxLeft: 0,
				maxTop: 100,
				callLeft: false,
				callTop: 'setHue'
			},
			
			alpha: {
				maxLeft: 0,
				maxTop: 100,
				callLeft: false,
				callTop: 'setAlpha'
			}
		},

		// https://github.com/DmitryBaranovskiy/raphael/
		RGBtoHSB : function (r, g, b, a){
			r /= 255;
			g /= 255;
			b /= 255;

			var H, S, V, C;
			V = Math.max(r, g, b);
			C = V - Math.min(r, g, b);
			H = (C === 0 ? null :
				V == r ? (g - b) / C :
				V == g ? (b - r) / C + 2 :
					(r - g) / C + 4
				);
			H = ((H + 360) % 6) * 60 / 360;
			S = C === 0 ? 0 : C / V;
			return {h: H||1, s: S, b: V, a: a||1};
		},
		
		HueToRGB: function (p, q, h) {
			if (h < 0)
				h += 1;
			else if (h > 1)
				h -= 1;

			if ((h * 6) < 1)
				return p + (q - p) * h * 6;
			else if ((h * 2) < 1)
				return q;
			else if ((h * 3) < 2)
				return p + (q - p) * ((2 / 3) - h) * 6;
			else
				return p;
		},
	
		HSLtoRGB: function (h, s, l, a)
		{
			if (s < 0) {
				s = 0;
			}
			var q;
			if (l <= 0.5) {
				q = l * (1 + s);
			} else {
				q = l + s - (l * s);
			}
			
			var p = 2 * l - q;

			var tr = h + (1 / 3);
			var tg = h;
			var tb = h - (1 / 3);

			var r = Math.round(CPGlobal.HueToRGB(p, q, tr) * 255);
			var g = Math.round(CPGlobal.HueToRGB(p, q, tg) * 255);
			var b = Math.round(CPGlobal.HueToRGB(p, q, tb) * 255);
			return [r, g, b, a||1];
		},

		// 正则表达式列表，用于从颜色字符串中提取出颜色值
		// from John Resig color plugin
		// https://github.com/jquery/jquery-color/
		stringParsers: [
			{
				re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
				parse: function( execResult ) {
					return [
						execResult[ 1 ],
						execResult[ 2 ],
						execResult[ 3 ],
						execResult[ 4 ]
					];
				}
			}, {
				re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
				parse: function( execResult ) {
					return [
						2.55 * execResult[1],
						2.55 * execResult[2],
						2.55 * execResult[3],
						execResult[ 4 ]
					];
				}
			}, {
				re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
				parse: function( execResult ) {
					return [
						parseInt( execResult[ 1 ], 16 ),
						parseInt( execResult[ 2 ], 16 ),
						parseInt( execResult[ 3 ], 16 )
					];
				}
			}, {
				re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
				parse: function( execResult ) {
					return [
						parseInt( execResult[ 1 ] + execResult[ 1 ], 16 ),
						parseInt( execResult[ 2 ] + execResult[ 2 ], 16 ),
						parseInt( execResult[ 3 ] + execResult[ 3 ], 16 )
					];
				}
			}, {
				re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
				space: 'hsla',
				parse: function( execResult ) {
					return [
						execResult[1]/360,
						execResult[2] / 100,
						execResult[3] / 100,
						execResult[4]
					];
				}
			}
		],

		template:	'<div class="colorpicker dropdown-menu">'+
						'<div class="colorpicker-saturation"><i><b></b></i></div>'+
						'<div class="colorpicker-hue"><i></i></div>'+
						'<div class="colorpicker-alpha"><i></i></div>'+
						'<div class="colorpicker-color"><div /></div>'+
					'</div>'
	};
});