var MODERN_BROWSER = !$.browser.msie || $.browser.version > 8;
(function() {
	$$ = function(selector, container) {
		if (!container)
			return $(selector);
		container = $(container);
		var result = $(selector, container);
		if (container.is(selector))
			result = result.addBack();
		return result;
	}
	var d = document.domain;
	if (!d.match(/^(\d+\.){3}\d+$/)) {
		d = d.split('.');
		try {
			if (d.length > 2)
				document.domain = d[d.length - 2] + '.' + d[d.length - 1];
		} catch (e) {
			if (d.length > 3)
				document.domain = d[d.length - 3] + '.' + d[d.length - 2] + '.'
						+ d[d.length - 1];
		}
	}
	$.ajaxSettings.traditional = true;
	var $ajax = $.ajax;
	if (MODERN_BROWSER)
		$.ajax = function(options) {
			options.url = UrlUtils.absolutize(options.url);
			if (!UrlUtils.isSameDomain(options.url)
					&& UrlUtils.isSameOrigin(options.url))
				options.xhrFields = {
					withCredentials : true
				};
			return $ajax(options);
		}

	if (typeof $.fn.fieldValue != 'undefined') {
		// override jquery.form.js
		$.fn.oldFieldValue = $.fn.fieldValue;
		$.fn.fieldValue = function(successful) {
			if ((this.hasClass('ignore-blank') || !this
					.hasClass('not-ignore-blank')
					&& this.closest('form').hasClass('ignore-blank'))
					&& !$.trim(this.val()))
				return null;
			var val = this.oldFieldValue(successful);
			if (val && this.is('[type="password"]') && this.hasClass('sha')
					&& typeof sha1 != 'undefined')
				try {
					val = sha1(val);
				} catch (e) {
					console.log(e);
				}
			return val;
		}

		$.oldFieldValue = $.fieldValue;
		$.fieldValue = function(el, successful) {
			var t = $(el);
			if ((t.hasClass('ignore-blank') || !t.hasClass('not-ignore-blank')
					&& t.closest('form').hasClass('ignore-blank'))
					&& !$.trim(t.val()))
				return null;
			var val = $.oldFieldValue(el, successful);
			if (val && t.is('[type="password"]') && t.hasClass('sha')
					&& typeof sha1 != 'undefined')
				try {
					val = sha1(val);
				} catch (e) {
					console.log(e);
				}
			return val;
		}
	}

	if (typeof $.rc4EncryptStr != 'undefined'
			&& ($('meta[name="pe"]').attr('content') != 'false')) {
		var temp = $.param;
		$.param = function(a, traditional) {
			if ($.isArray(a) || a.jquery) {
				$.each(a, function() {
					if (this.type == 'password') {
						try {
							var key = $.cookie('T');
							if (key && key.length > 10)
								key = key
										.substring(key.length - 10, key.length);
							this.value = $.rc4EncryptStr(this.value + key, key);
						} catch (e) {
						}
					}
				});

			}
			return temp(a, traditional);
		}
	}

	/* http://ejohn.org/blog/javascript-micro-templating/ */
	var cache = {};
	$.tmpl = function(str, data) {
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		var fn = !/\W/.test(str) ? cache[str] = cache[str]
				|| tmpl(document.getElementById(str).innerHTML) :

				// Generate a reusable function that will serve as a template
				// generator (and which will be cached).
				new Function("obj",
						"var p=[],print=function(){p.push.apply(p,arguments);};"
								+

								// Introduce the data as local variables using
								// with(){}
								"with(obj){p.push('" +

								// Convert the template into pure JavaScript
								str.replace(/[\r\t\n]/g, " ").split("{{")
										.join("\t").replace(/((^|%>)[^\t]*)'/g,
												"$1\r").replace(/\t(.*?)}}/g,
												"',$1,'").split("\t")
										.join("');").split("}}")
										.join("p.push('").split("\r")
										.join("\\'") + "');}return p.join('');");

		// Provide some basic currying to the user
		return data ? fn(data) : fn;
	};

})();

Indicator = {
	text : '',
	show : function(iserror) {
		if (!$('#indicator').length)
			$('<div id="indicator"></div>').appendTo(document.body);
		var ind = $('#indicator');
		if (iserror && ind.hasClass('loading'))
			ind.removeClass('loading');
		if (!iserror && !ind.hasClass('loading'))
			ind.addClass('loading');
		ind.html(Indicator.text || MessageBundle.get('ajax.loading'));
		if (!iserror)
			ind.prepend('<span class="icon-loading small"></span>');
		ind.show();
		Indicator.text = '';
	},
	showError : function(msg) {
		Indicator.text = msg || MessageBundle.get('ajax.error');
		Indicator.show(true);
	},
	hide : function() {
		Indicator.text = '';
		if ($('#indicator'))
			$('#indicator').hide()
	}
};

ProgressBar = {
	show : function(percent, simulate) {
		if (percent < 0)
			percent = 0;
		else if (percent > 100)
			percent = 100;
		else if (percent < 1)
			percent *= 100;
		var pb = $('#progress-bar');
		if (!pb.length) {
			pb = $('<div id="progress-bar"><div class="progress"></div></div>')
					.prependTo(document.body);
			setTimeout(function() {
						pb.data('percent', percent).css('opacity', '1')
								.find('.progress').css('width', percent + '%');
					}, 20);
			return;
		}
		if (!simulate)
			ProgressBar.stopSimulate();
		var prevPercent = pb.data('percent') || 0;
		if (prevPercent > percent)
			return;
		pb.data('percent', percent).css('opacity', '1').find('.progress').css(
				'width', percent + '%');
	},
	hide : function() {
		var pb = $('#progress-bar');
		if (pb.length) {
			ProgressBar.show(100);
			setTimeout(function() {
						pb.remove()
					}, 200);
		}
	},
	simulate : function() {
		ProgressBar.show(5, true);
		var pb = $('#progress-bar');
		var interval = setInterval(function() {
					var percent = pb.data('percent');
					var nextPercent = percent + Math.random() * 10;
					if (nextPercent > 84) {
						ProgressBar.stopSimulate();
					} else {
						ProgressBar.show(nextPercent, true);
					}
				}, 1000);
		pb.data('interval', interval);
	},
	stopSimulate : function() {
		var intv = $('#progress-bar').data('interval');
		if (intv)
			clearInterval(intv);
	}
};

UrlUtils = {
	extractDomain : function(a) {
		if (UrlUtils.isAbsolute(a)) {
			a = a.replace(/:\d+/, '');
			a = a.substring(a.indexOf('://') + 3);
			var i = a.indexOf('/');
			if (i > 0)
				a = a.substring(0, i);
			return a;
		} else {
			return document.location.hostname;
		}
	},
	isSameDomain : function(a, b) {
		b = b || document.location.href;
		var ad = UrlUtils.extractDomain(a);
		var bd = UrlUtils.extractDomain(b);
		return ad == bd;
	},
	isSameOrigin : function(a, b) {
		b = b || document.location.href;
		var ad = UrlUtils.extractDomain(a);
		var bd = UrlUtils.extractDomain(b);
		if ($.browser.msie && ad != bd)
			return false;
		var arra = ad.split('.');
		var arrb = bd.split('.');
		return (arra[arra.length - 1] == arrb[arrb.length - 1] && arra[arra.length
				- 2] == arrb[arrb.length - 2]);
	},
	isAbsolute : function(a) {
		if (!a)
			return false;
		if (a.indexOf('//') == 0)
			return true;
		var index = a.indexOf('://');
		return (index == 4 || index == 5);
	},
	absolutize : function(url) {
		if (UrlUtils.isAbsolute(url))
			return url;
		var a = document.location.href;
		var index = a.indexOf('://');
		if (url.length == 0 || url.indexOf('/') == 0) {
			var host = a.substring(0, a.indexOf('/', index + 3));
			if (CONTEXT_PATH && url.indexOf(CONTEXT_PATH + '/') != 0)
				host += CONTEXT_PATH;
			return host + url;
		} else {
			return a.substring(0, a.lastIndexOf('/') + 1) + url;
		}
	},
	resolvePath : function(ele, baseurl) {
		if (!baseurl)
			return;
		if (baseurl.indexOf('/') == 0)
			baseurl = UrlUtils.absolutize(baseurl);
		var base1 = baseurl.substring(0, baseurl.indexOf('/', baseurl
								.indexOf('://')
								+ 3));
		var base2 = baseurl.substring(0, baseurl.lastIndexOf('/') + 1);
		if (baseurl.indexOf(document.location.protocol + '//'
				+ document.location.host + '/') == 0) {
			base1 = '';
			base2 = base2.substring(base2
					.indexOf('/', base2.indexOf('://') + 3));
		}
		$$('a,form,button', ele).each(function() {
			var t = $(this);
			var arr = 'href,action,formaction'.split(',');
			for (var k = 0; k < arr.length; k++) {
				var attr = arr[k];
				var value = t.attr(attr);
				if (value && value.indexOf('://') < 0
						&& value.indexOf('//') != 0) {
					value = (value.indexOf('/') == 0 ? base1 : base2) + value;
					t.attr(attr, value);
				}
			}
		});
	}
}

Message = {
	compose : function(message, className) {
		return '<div class="' + className
				+ '"><a class="close" data-dismiss="alert">&times;</a>'
				+ message + '</div>';
	},
	showMessage : function() {
		Message.showActionMessage(MessageBundle.get.apply(this, arguments));
	},
	showError : function() {
		Message.showActionError(MessageBundle.get.apply(this, arguments));
	},
	showActionError : function(messages, target) {
		Message.showActionMessage(messages, target, true);
	},
	showActionMessage : function(messages, target, error) {
		if (!messages)
			return;
		if (typeof messages == 'string') {
			var a = [];
			a.push(messages);
			messages = a;
		}
		if ($(target).hasClass('alerts')) {
			if ($.alerts) {
				$.alerts.info(messages.join('\n'), ' ');
			} else {
				alert(messages.join('\n'));
			}
			return;
		}
		var html = '';
		for (var i = 0; i < messages.length; i++)
			html += Message.compose(messages[i], error
							? 'action-error alert alert-error'
							: 'action-message alert alert-info');
		if (html) {
			var parent = $('#content');
			if ($('.ui-dialog:visible').length)
				parent = $('.ui-dialog:visible .ui-dialog-content').last();
			if ($('.modal:visible').length)
				parent = $('.modal:visible .modal-body').last();
			if (!$('#message', parent).length)
				$('<div id="message"></div>').prependTo(parent);
			var msg = $('#message', parent);
			if (error && target && $(target).prop('tagName') == 'FORM') {
				if (!$(target).attr('id'))
					$(target).attr('id', 'form' + new Date().getTime());
				var fid = $(target).attr('id');
				if ($('#' + fid + '_message').length == 0)
					$('<div id="' + fid
							+ '_message" class="message-container"></div>')
							.insertBefore(target);
				msg = $('#' + fid + '_message');
			}
			msg.html(html);
			_observe(msg);
			$('html,body').animate({
						scrollTop : msg.offset().top - 50
					}, 100);
		}
	},
	showFieldError : function(field, msg, msgKey) {
		var msg = msg || MessageBundle.get(msgKey);
		if (field && $(field).length) {
			field = $(field).not(':disabled');
			var tabpane = field.closest('.tab-pane');
			if (tabpane.length
					&& $(field).closest('form').get(0) == tabpane
							.closest('form').get(0)
					&& !tabpane.hasClass('active'))
				$('a[href$="#' + tabpane.attr('id') + '"]').tab('show');
			var cgroup = Form.findControlGroup(field);
			cgroup.length ? cgroup.addClass('error') : field.addClass('error');
			$('.field-error', field.parent()).remove();
			if (field.hasClass('sqleditor'))
				field = field.next('.preview');
			else if (field.hasClass('chzn-done'))
				field = field.next('.chzn-container');
			if (field.is(':visible')) {
				field.parent().css('position', 'relative');
				var prompt = $('<div class="field-error field-error-popover"><div class="field-error-content">'
						+ msg
						+ '<a class="remove pull-right" href="#">&times;</a></div><div>')
						.insertAfter(field);
				var promptTopPosition, promptleftPosition;
				var fieldWidth = field.width();
				var promptHeight = prompt.height();
				promptTopPosition = field.position().top + field.outerHeight()
						+ 6;
				var parentWidth = field.closest('.controls').width();
				if (parentWidth
						&& (parentWidth - fieldWidth) < (prompt.width() - 30)) {
					promptleftPosition = field.position().left + fieldWidth
							- (prompt.width() + 10);
				} else {
					promptleftPosition = field.position().left + fieldWidth
							- 30;
				}
				if (promptleftPosition < 0)
					promptleftPosition = 0;
				prompt.css({
							"top" : promptTopPosition + "px",
							"left" : promptleftPosition + "px",
							"opacity" : 0.2
						});
				prompt.animate({
							"opacity" : 0.8
						});
			} else if (field.is('[type="hidden"]')) {
				var selector = '.listpick,.treeselect';
				var fp = field.parent(selector);
				if (fp.length && !fp.is('.control-group')) {
					cgroup.length ? cgroup.removeClass('error') : field
							.removeClass('error');
					$('<span class="field-error">' + msg + '</span>')
							.appendTo(fp);
				} else if (cgroup.length) {
					// $('.controls span', cgroup).text('');
					$('<span class="field-error">' + msg + '</span>')
							.appendTo($('.controls', cgroup));
				} else {
					if (field.next(selector).length) {
						$('<span class="field-error">' + msg + '</span>')
								.insertAfter(field.next());
					} else {
						Message.showActionError(msg);
					}
				}
			} else if (field.is('.custom[type="file"]')) {
				$('<span class="field-error">' + msg + '</span>')
						.insertAfter(field.next('.filepick')
								.find('.filepick-handle'));
			} else
				Message.showActionError(msg);
		} else
			Message.showActionError(msg);
	}
};

Form = {
	focus : function(form) {
		var arr = $(':input:visible', form).get();
		for (var i = 0; i < arr.length; i++) {
			if ($('.field-error', $(arr[i]).parent()).length) {
				setTimeout(function() {
							$(arr[i]).focus();
						}, 50);
				break;
			}
		}
	},
	clearError : function(target) {
		if ($(target).prop('tagName') == 'FORM') {
			$('.control-group.error, .error:input', target)
					.removeClass('error');
			$('.field-error', target).fadeIn().remove();
		} else if ($(target).prop('tagName') == 'DIV') {
			$(target).removeClass('error');
			$('.field-error', target).fadeIn().remove();
		} else {
			var cg = Form.findControlGroup(target);
			cg.length ? cg.removeClass('error') : $(target)
					.removeClass('error');
			$('.field-error', $(target).parent()).fadeIn().remove();
		}
	},
	validate : function(target, evt) {
		var t = $(target);
		if (t.prop('tagName') != 'FORM') {
			if (!t.is('[type="hidden"]') || !t.prevAll(':input').length)
				Form.clearError(target);
			if (t.is('input[type="radio"]')) {
				if (t.hasClass('required')) {
					var options = $('input[type="radio"][name="' + target.name
									+ '"]', target.form);
					var checked = false;
					$.each(options, function(i, v) {
								if (v.checked)
									checked = true;
							});
					if (!checked) {
						Message.showFieldError(target, null, 'required');
						return false;
					}
				}
			}
			var valid = true;
			var tabpane = t.closest('.tab-pane');
			var inhiddenpanel = tabpane.length
					&& t.closest('form').get(0) == tabpane.closest('form')
							.get(0) && t.css('display') != 'none'
					&& !tabpane.hasClass('active');
			if (inhiddenpanel
					&& $('.control-group.error', tabpane
									.siblings('.tab-pane.active')).length)
				return;
			if ((inhiddenpanel || t
					.is(':visible,[type="hidden"],.custom[type="file"],.sqleditor,.chzn-done'))
					&& !t.prop('disabled')) {
				var value = t.val();
				if (t.hasClass('required') && t.attr('name') && !value) {
					Message.showFieldError(target, null,
							t.prop('tagName') == 'SELECT'
									|| t.is('[type="hidden"]')
									|| t.is('.custom[type="file"]')
									? 'selection.required'
									: 'required');
					if (inhiddenpanel)
						$('a[href="#' + t.closest('.tab-pane').attr('id')
								+ '"]').tab('show');
					valid = false;
				} else if (evt != 'keyup'
						&& t.hasClass('email')
						&& value
						&& !value
								.match(/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/)) {
					Message.showFieldError(target, null, 'email');
					valid = false;
				} else if (evt != 'keyup' && t.hasClass('regex') && value) {
					var regex = t.data('regex');
					if (regex) {
						if (regex.indexOf('^') != 0)
							regex = '^' + regex + '$';
						if (!new RegExp(regex).test(value)) {
							Message.showFieldError(target, null, 'regex');
							valid = false;
						}
					}
				} else if (evt != 'keyup' && t.hasClass('phone') && value
						&& !value.match(/^[\d-]+$/)) {
					Message.showFieldError(target, null, 'phone');
					valid = false;
				} else if ((t.hasClass('integer') || t.hasClass('long'))
						&& value) {
					if (t.hasClass('positive')
							&& (!value.match(/^[+]?\d*$/) || !t
									.hasClass('zero')
									&& parseInt(value) == 0)) {
						Message
								.showFieldError(target, null,
										'integer.positive');
						valid = false;
					}
					if (!t.hasClass('positive') && !value.match(/^[-+]?\d*$/)) {
						Message.showFieldError(target, null, 'integer');
						valid = false;
					}
				} else if (t.hasClass('double') && value) {
					if (t.hasClass('positive')
							&& (!value.match(/^[+]?\d+\.?(\d+)?$/) || !t
									.hasClass('zero')
									&& parseFloat(value) == 0)) {
						Message.showFieldError(target, null, 'double.positive');
						valid = false;
					}
					if (!t.hasClass('positive')
							&& !value.match(/^[-+]?\d+\.?(\d+)?$/)) {
						Message.showFieldError(target, null, 'double');
						valid = false;
					}
					var i = value.indexOf('.');
					if (i > -1) {
						var decimal = value.substring(i + 1);
						var scale = parseInt(t.data('scale') || '2');
						if (decimal.length > scale) {
							value = value.substring(0, i + 1)
									+ decimal.substring(0, scale);
							t.val(value);
						}
					}
				} else if (evt != 'keyup' && t.hasClass('repeat')) {
					if (value != $('[name="' + t.data('repeatwith') + '"]',
							t.closest('form')).val()) {
						Message.showFieldError(target, null,
								'repeat.not.matched');
						valid = false;
					}
				}
			}
			return valid;
		} else {
			var valid = true;
			$(':input:not(:button):not(:disabled)', target).each(function() {
						if (!Form.validate(this))
							valid = false;
					});
			if (!valid)
				Form.focus(target);
			var groups = {};
			$('[data-only-one-required-group]', target).each(function() {
				var t = $(this);
				if (t.is(':visible,[type="hidden"],.sqleditor,.chzn-done')
						&& !t.prop('disabled')) {
					var group = t.data('only-one-required-group');
					var inputs = groups[group];
					if (!inputs) {
						inputs = [];
						groups[group] = inputs;
					}
					inputs.push(t);
				}
			});
			for (var group in groups) {
				var inputs = groups[group];
				var matched = 0;
				var labels = [];
				$.each(inputs, function(i, v) {
							labels.push($('.control-label',
									Form.findControlGroup(v)).text());
							if (v.val())
								matched++;
						});
				if (matched != 1) {
					valid = false;
					$.each(inputs, function(i, v) {
								var cg = Form.findControlGroup(v);
								cg.length ? cg.addClass('error') : v
										.addClass('error');
							});
					Message.showActionError(MessageBundle.get(
									'required.only.one', '[' + labels + ']'),
							target);
				}
			}
			groups = {};
			$('[data-at-least-one-required-group]', target).each(function() {
				var t = $(this);
				if (t.is(':visible,[type="hidden"],.sqleditor,.chzn-done')
						&& !t.prop('disabled')) {
					var group = t.data('at-least-one-required-group');
					var inputs = groups[group];
					if (!inputs) {
						inputs = [];
						groups[group] = inputs;
					}
					inputs.push(t);
				}
			});
			for (var group in groups) {
				var inputs = groups[group];
				var matched = 0;
				var labels = [];
				$.each(inputs, function(i, v) {
							labels.push($('.control-label',
									Form.findControlGroup(v)).text());
							if (v.val())
								matched++;
						});
				if (matched < 1) {
					valid = false;
					$.each(inputs, function(i, v) {
								var cg = Form.findControlGroup(v);
								cg.length ? cg.addClass('error') : v
										.addClass('error');
							});
					Message.showActionError(MessageBundle
									.get('required.at.least.one', '[' + labels
													+ ']'), target);
				}
			}
			return valid;
		}
	},
	findControlGroup : function(target) {
		var t = $(target);
		if (t.parent('.input-append,.input-prepend').length)
			t = t.parent();
		if (t.is('[type="hidden"]')) {
			var cg = t.parent('.control-group');
			if (cg.length)
				return cg;
		}
		return t.parent('.controls').parent('.control-group');
	}
};

Ajax = {
	defaultRepacement : 'content',
	fire : function(target, funcName) {
		if (!target)
			return true;
		var func = target[funcName];
		if (typeof func == 'undefined')
			func = $(target).attr(funcName);
		if (typeof func == 'undefined' || !func)
			return true;
		var args = [];
		if (arguments.length > 2)
			for (var i = 2; i < arguments.length; i++)
				args[i - 2] = arguments[i];
		var ret;
		if (typeof(func) == 'function') {
			ret = func.apply(target, args);
		} else {
			if (func.indexOf('return') > -1)
				func = func.replace('return', '');
			target._temp = function() {
				return eval(func)
			};
			try {
				ret = target._temp();
			} catch (e) {
				alert(e);
			}
		}
		if (false == ret)
			return false;
		return true;
	},
	handleResponse : function(data, options, xhr) {
		if (!data)
			return;
		var hasError = false;
		var target = options.target;
		if (target && $(target).parents('div.ui-dialog').length)
			options.quiet = true;
		if ((typeof data == 'string')
				&& (data.indexOf('{') == 0 || data.indexOf('[') == 0))
			data = $.parseJSON(data);
		if (typeof data == 'string') {
			var i = data.indexOf('<title>');
			if (i >= 0 && data.indexOf('</title>') > 0) {
				Ajax.title = data.substring(data.indexOf('<title>') + 7, data
								.indexOf('</title>'));
				if (options.replaceTitle)
					document.title = Ajax.title;
				if (i == 0)
					data = data.substring(data.indexOf('</title>') + 8);
			}
			var html = data.replace(/<script(.|\s)*?\/script>/g, '');
			var div = $('<div/>').html(html);
			UrlUtils.resolvePath(div, options.url);
			html = div.html();
			var replacement = options.replacement;
			if (typeof replacement == 'string'
					|| typeof replacement == 'number') {
				var map = {};
				var entries = replacement.toString().split(',');
				var arr = [];
				for (var i = 0; i < entries.length; i++) {
					var entry = entries[i];
					var ss = entry.split(':', 2);
					var sss = ss.length == 2 ? ss[1] : ss[0];
					map[ss[0]] = sss;
					arr.push(sss != Ajax.defaultRepacement ? sss : '_');
				}
				replacement = map;
			}
			for (var key in replacement) {
				var r = $('#' + key);
				if (key == Ajax.defaultRepacement && !r.length)
					r = $('body');
				$('.intervaled', r).each(function() {
							clearInterval($(this).data('_interval'));
						});
				if (!options.quiet && r.length) {
					var pin = $('.pin', r);
					var top = pin.length ? pin.offset().top : r.offset().top;
					$('html,body').animate({
								scrollTop : top - 50
							}, 100);
				}
				var rep = div.find('#' + replacement[key]);
				if (rep.length) {
					r.replaceWith(rep);
					_observe(rep);
				} else {
					if (div.find('#content').length)
						r.html(div.find('#content').html());
					else if (div.find('body').length)
						r.html(div.find('body').html());
					else {
						if (html.indexOf('<body>') > 0)
							html = html.substring(html.indexOf('<body>') + 6,
									html.indexOf('</body>'));
						r.html(html);
					}
					_observe(r);
				}
				if (!options.quiet && (typeof $.effects != 'undefined'))
					r.effect('highlight');
			}
			div.remove();
			if (options.onsuccess)
				options.onsuccess.apply(window, [data, xhr]);
			if (!options.preflight)
				Ajax.fire(target, 'onsuccess', data, xhr);
		} else {
			Ajax.jsonResult = data;
			if (data.fieldErrors || data.actionErrors) {
				hasError = true;
				if (options.onerror)
					options.onerror.apply(window, [data, xhr]);
				Ajax.fire(target, 'onerror', data, xhr);
			} else {
				if (options.onsuccess)
					options.onsuccess.apply(window, [data, xhr]);
				if (!options.preflight)
					Ajax.fire(target, 'onsuccess', data, xhr);
			}
			setTimeout(function() {
						Message.showActionError(data.actionErrors, target);
						Message.showActionMessage(data.actionMessages, target);
					}, 500);

			if (data.fieldErrors) {
				if (target) {
					for (key in data.fieldErrors) {
						var field = $(target).find('[name="' + key + '"]');
						if (!field.length)
							field = $(target).find('[name$=".' + key + '"]');
						Message.showFieldError(field.get(0),
								data.fieldErrors[key]);
					}
					Form.focus(target);
				} else {
					for (key in data.fieldErrors)
						Message.showActionError(data.fieldErrors[key]);
				}
			}
		}
		if ($(target).prop('tagName') == 'FORM' && !options.preflight) {
			if (!hasError && $(target).hasClass('disposable'))
				$(target).addClass('disposed').find(':input').prop('disabled',
						true);
			if (!hasError && $(target).hasClass('reset') && target.reset) {
				target.reset();
			}
		}
		Indicator.text = '';
		Ajax.fire(target, 'oncomplete', data);
	},
	jsonResult : null,
	title : ''
};

function ajaxOptions(options) {
	options = options || {};
	if (typeof options.global == 'undefined' || options.global) {
		options.xhr = function() {
			var xhr = $.ajaxSettings.xhr();
			if (xhr instanceof XMLHttpRequest) {
				xhr.addEventListener('progress', function(evt) {
							if (evt.lengthComputable)
								ProgressBar.show(evt.loaded / evt.total);
						});
				xhr.addEventListener('loadend', ProgressBar.hide);
			}
			return xhr;
		}
	}
	if (!options.dataType)
		options.dataType = 'text';
	if (!options.headers)
		options.headers = {};

	$.extend(options.headers, {
				'X-Data-Type' : options.dataType
			});
	var target = $(options.target);
	var replacement = {};
	var entries = (options.replacement
			|| $(options.target).data('replacement')
			|| ($(options.target).prop('tagName') == 'FORM' ? $(target)
					.attr('id') : null) || Ajax.defaultRepacement).split(',');
	var arr = [];
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		var ss = entry.split(':', 2);
		var sss = ss.length == 2 ? ss[1] : ss[0];
		replacement[ss[0]] = sss;
		arr.push(sss != Ajax.defaultRepacement ? sss : '_');
	}
	options.replacement = replacement;
	$.extend(options.headers, {
				'X-Fragment' : arr.join(',')
			});
	var beforeSend = options.beforeSend;
	options.beforeSend = function(xhr) {
		if (beforeSend)
			beforeSend(xhr);
		Indicator.text = options.indicator;
		Ajax.fire(null, options.onloading);
	}
	var success = options.success;
	options.success = function(data, textStatus, xhr) {
		Ajax.handleResponse(data, options, xhr);
		if (success && !(data.fieldErrors || data.actionErrors))
			success(data, textStatus, xhr);
	};
	return options;
}

function ajax(options) {
	return $.ajax(ajaxOptions(options));
}

var CONTEXT_PATH = $('meta[name="context_path"]').attr('content') || '';

if (typeof(Initialization) == 'undefined')
	Initialization = {};
if (typeof(Observation) == 'undefined')
	Observation = {};
function _init() {
	var array = [];
	for (var key in Initialization) {
		if (typeof(Initialization[key]) == 'function')
			array.push(key);
	}
	array.sort();
	for (var i = 0; i < array.length; i++)
		Initialization[array[i]].call(this);
	_observe();
}
function _observe(container) {
	if (!container)
		container = document;
	$$('.chart,form.ajax,.ajaxpanel', container).each(function(i) {
		if (!$(this).attr('id'))
			$(this).attr(
					'id',
					('a' + (i + Math.random())).replace('.', '')
							.substring(0, 5));
	});
	var array = [];
	for (var key in Observation) {
		if (typeof(Observation[key]) == 'function')
			array.push(key);
	}
	array.sort();
	for (var i = 0; i < array.length; i++)
		Observation[array[i]].call(this, container);
}
$(_init);

Initialization.common = function() {
	$(document).ajaxStart(function() {
				Indicator.show();
				ProgressBar.simulate();
			}).ajaxComplete(ProgressBar.hide).ajaxError(function() {
				Indicator.showError()
			}).ajaxSuccess(function(ev, xhr) {
		Indicator.hide();
		var url = xhr.getResponseHeader('X-Redirect-To');
		if (url) {
			$('body')
					.html('<div class="modal"><div class="modal-body"><div class="progress progress-striped active"><div class="bar" style="width: 50%;"></div></div></div></div>');
			var url = UrlUtils.absolutize(url);
			try {
				var href = top.location.href;
				if (href && UrlUtils.isSameDomain(href, url))
					top.location.href = url;
				else
					document.location.href = url;
			} catch (e) {
				document.location.href = url;
			}
			return;
		}
		var csrf = xhr.getResponseHeader('X-Csrf');
		if (csrf)
			$('input[type="hidden"][name="csrf"]').val(csrf);
	}).keyup(function(e) {
		if (e.keyCode == 27) {
			if ($('.modal:visible').length)
				$('.modal:visible').last().find('.close').click();
			else if ($('.ui-dialog:visible').length)
				$('.ui-dialog:visible').last()
						.find('.ui-dialog-titlebar-close').click();
		}
	}).on('reset', 'form', function(e) {
				var t = $(e.target);
				t.find('.resetable').html('');
				setTimeout(function() {
							t.find(':input').filter(function() {
										return $(this).val()
									}).change();
						}, 200);
				$('.action-error .remove').click();
				$('.field-error .remove', t).click();
				var nav = t.find('.nav-tabs');
				if (nav.length)
					nav.find('li:first a').click();
			}).on('click', 'form.ajax :submit', function() {
				$(this).addClass('clicked');
			}).on('click', 'label[for]', function(event) {
				if ($(document.getElementById($(this).attr('for')))
						.prop('readonly'))
					event.preventDefault();
			}).on('click', '#message .close,.message-container .close',
			function() {
				$('#message,.message-container').each(function(i, v) {
							if (!$.trim($(v).text()))
								$(v).remove();
						});
			}).on('click', '.removeonclick', function() {
				$(this).remove()
			}).on('click', '.field-error .remove', function(e) {
		var t = $(e.target);
		var cg = Form.findControlGroup(t);
		Form.clearError(cg.length ? cg : t.closest('.field-error')
				.prev(':input'));
		t.closest('.field-error').remove();
		return false;
	}).on('validate', ':input', function(ev) {
				Form.validate(this, 'validate');
			}).on('keyup', 'input,textarea', $.debounce(200, function(ev) {
						if ($(this).val()) {
							if (ev.keyCode != 13)
								Form.validate(this, 'keyup');
						} else {
							Form.clearError($(this));
						}
						return true;
					})).on('change', 'input,textarea', function(ev) {
				if (!this.defaultValue || this.value != this.defaultValue)
					Form.validate(this, 'change');
				return true;
			}).on('change', 'select', function() {
				Form.validate(this, 'change');
				return true;
			}).on('dblclick', '.ui-dialog-titlebar', function() {
		Dialog.toggleMaximization($('.ui-dialog-content', $(this)
						.closest('.ui-dialog')));
	}).on('click', '.ui-dialog .dialog-close', function(evt) {
		evt.preventDefault();
		$(evt.target).closest('.ui-dialog').find('.ui-dialog-titlebar-close')
				.click();
	}).on('mouseenter', '.popover,.tooltip', function() {
				$(this).remove()
			}).on('click', '.action-error strong.force-override', function(e) {
				var msgcontainer = $(e.target).closest('.message-container');
				if (msgcontainer.length) {
					var form = msgcontainer.next('form');
					$('input[type="hidden"].version', form).val('');
					msgcontainer.fadeOut().remove();
					form.submit();
				} else {
					var button = $('button[data-action="save"]:visible');
					$('tr', button.closest('form')).filter(function() {
								return $(this).find('td.edited').length;
							}).removeData('version').removeAttr('data-version');
					button.click();
				}

			}).on('change', 'select', function(e) {
				var t = $(this);
				var option = t.find('option:eq(0)');
				if (!option.attr('value') && option.text()) {
					if (!t.val())
						t.addClass('empty');
					else
						t.removeClass('empty');
				}
			}).on('click', 'img.captcha', Captcha.refresh).on('focus',
			'input.captcha', function() {
				var t = $(this);
				if (t.siblings('img.captcha').length)
					return;
				t.after('<img class="captcha" src="' + t.data('captcha')
						+ '"/>');
			}).on('keyup', 'input.captcha', function() {
				var t = $(this);
				t.removeClass('input-error');
				if (t.val().length >= 4)
					t.trigger('verify');
			})
			/*
			 * .on('focusout', 'input.captcha', function() {
			 * $(this).trigger('verify'); })
			 */.on('verify', 'input.captcha', function() {
		var t = $(this);
		var img = t.next('img.captcha');
		if (t.val() && img.length) {
			var token = img.attr('src');
			var index = token.indexOf('token=');
			if (index > -1)
				token = token.substring(index + 6);
			index = token.indexOf('&');
			if (index > -1)
				token = token.substring(0, index);
			$.ajax({
						global : false,
						type : "POST",
						url : CONTEXT_PATH + '/verifyCaptcha',
						data : {
							captcha : t.val(),
							token : token
						},
						success : function(result) {
							result == 'false' ? t.addClass('input-error')
									.focus() : t.removeClass('input-error')
									.blur();
						}
					});
		}
	}).on('click', '.layout-change', function() {
		var fluidLayout = 'false' != $.cookie('fluidLayout')
				&& $('#content').hasClass('container-fluid');
		$.cookie('fluidLayout', !fluidLayout, {
					path : CONTEXT_PATH || '/',
					expires : 365
				});
		document.location.reload();
		return false;
	});
	$.alerts.okButton = MessageBundle.get('confirm');
	$.alerts.cancelButton = MessageBundle.get('cancel');
	Nav.init();
	Nav.activate(document.location.href);
	var hash = document.location.hash;
	if (hash) {
		$('.nav-tabs').each(function() {
			var found = false;
			$('a[data-toggle="tab"]', this).each(function() {
				var t = $(this);
				if (!found) {
					var selector = t.attr('data-target');
					if (!selector) {
						selector = t.attr('href');
						selector = selector
								&& selector.replace(/.*(?=#[^\s]*$)/, '');
					}
					if (selector == hash) {
						found = true;
						t.tab('show');
						$target = $(selector);
						if ($target.hasClass('ajaxpanel'))
							$target.removeClass('manual');

					}
				}
			});
		});
	}
	if ($(document.body).hasClass('render-location-qrcode')) {
		$('<div id="render-location-qrcode" class="hidden-phone hidden-tablet" style="width:15px;position:fixed;bottom:0;right:0;cursor:pointer;"><i class="glyphicon glyphicon-qrcode"></i></div>')
				.appendTo(document.body);
		$('#render-location-qrcode').click(function() {
			var _this = $(this);
			_this.hide();
			var modal = $('<div class="modal" style="z-index:10000;"><div class="modal-close"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div><div class="modal-body" style="max-height:600px;"><div class="location-qrcode">'
					+ document.location.href + '</div></div></div>')
					.appendTo(document.body);
			$('.location-qrcode', modal).encodeqrcode();
			$('button.close', modal).click(function() {
						modal.remove();
						_this.show();
					});
		});
	}
	if (document.location.search.indexOf('printpage=true') != -1) {
		window.print();
		setTimeout(function() {
					window.close();
				}, 1000);
	}
	if ($('.time[title]').length) {
		setInterval(function() {
					$('.time[title]').each(function() {
								var t = $(this);
								t.text(DateUtils.humanRead(t.attr('title')));
							});
				}, 60 * 1000);
	}
	if ($('body').hasClass('welcome')) {
		$('<section id="powered-by">Powered by Ironrhino</section>')
				.appendTo(document.body);
	}
	$(document).on('click', '.scroll-list .load-more', function(e) {
		var t = $(this);
		if (t.hasClass('loading'))
			return;
		t.addClass('loading').data('orginaltext', t.text()).text(MessageBundle
				.get('ajax.loading'));
		var list = t.closest('.scroll-list');
		var pagesize = 10;
		if (list.data('pagesize'))
			pagesize = parseInt(list.data('pagesize'));
		var url = list.data('scrollurl') || document.location.href;
		var params = {
			since : $('.scroll-item:last', list).data('position')
		}
		var headers = {};
		if (list.attr('id'))
			headers['X-Fragment'] = list.attr('id');
		$.ajax({
			global : false,
			url : url,
			data : params,
			headers : headers,
			success : function(data) {
				var items = $('<div/>').html(data).find('.scroll-item');
				if (items.length < pagesize) {
					t.prop('disabled', true);
				} else {
					$(window).on('scroll', function() {
						if ($(window).scrollTop() + $(window).height() > $(document)
								.height()
								- 10) {
							$(window).off('scroll');
							$('.scroll-list .load-more').click();
						}
					});
				}
				items.each(function(i, v) {
							t.before(v);
							_observe(v);
						});
			},
			complete : function() {
				t.removeClass('loading').text(t.data('orginaltext'));
			}
		});

	});
	if ($('.scroll-list .load-more').length)
		$(window).scroll(function() {
			if ($(window).scrollTop() + $(window).height() > $(document)
					.height()
					- 10) {
				$(window).off('scroll');
				$('.scroll-list .load-more').click();
			}
		});
};

var HISTORY_ENABLED = MODERN_BROWSER
		&& (typeof history.pushState != 'undefined')
		&& ($('meta[name="history_enabled"]').attr('content') != 'false');
if (HISTORY_ENABLED) {
	Initialization.history = function() {
		window.onpopstate = function(event) {
			var url = document.location.href;
			Nav.activate(url);
			if (event.state) {
				ajax({
							url : url,
							replaceTitle : true,
							replacement : event.state.replacement,
							cache : false,
							beforeSend : function() {
								if (typeof $.fn.mask != 'undefined') {
									var replacement = event.state.replacement
											|| Ajax.defaultRepacement;
									$.each(replacement.split(','), function(i,
													v) {
												if (v.indexOf(':') > -1)
													v = v.substring(0,
															v.indexOf(':'));
												$('#' + v).mask();
											});
								}
							},
							complete : function() {
								if (typeof $.fn.mask != 'undefined') {
									var replacement = event.state.replacement
											|| Ajax.defaultRepacement;
									$.each(replacement.split(','), function(i,
													v) {
												if (v.indexOf(':') > -1)
													v = v.substring(0,
															v.indexOf(':'));
												$('#' + v).unmask();
											});
								}
							}
						});
			}
		};
	}
}

Observation.common = function(container) {
	$$('input.double', container).each(function() {
				var t = $(this);
				var value = t.val();
				if (value && value.indexOf('E-') > 0) {
					value = parseFloat(value);
					t.val(value);
				}
			});
	$$('select', container).each(function() {
				var t = $(this);
				var option = t.find('option:eq(0)');
				if (!option.attr('value') && option.text() && !t.val())
					t.addClass('empty');
			});
	$$('.controls .field-error', container).each(function() {
				var text = $(this).text();
				var field = $(':input', $(this).parent());
				$(this).remove();
				Message.showFieldError(field, text);
			});
	var ele = ($(container).prop('tagName') == 'FORM' && $(container)
			.hasClass('focus')) ? container : $('.focus:eq(0)', container);
	if (ele.prop('tagName') != 'FORM' && ele.attr('name')) {
		ele.focus();
	} else {
		var arr = $(':input:visible', ele).toArray();
		for (var i = 0; i < arr.length; i++) {
			var e = $(arr[i]);
			if (e.attr('name') && !e.val()) {
				e.focus();
				break;
			}
		}
	}
	$$('form', container).each(function() {
				if ($('input[type="file"]', this).length)
					$(this).attr('enctype', 'multipart/form-data');
				if (!$(this).hasClass('ajax'))
					$(this).submit(function() {
								$('.action-error').remove();
								return Form.validate(this)
							});
			});
	$$('input[type="text"]', container).on('paste', function() {
				var t = $(this);
				setTimeout(function() {
							t.val($.trim(t.val()));
						}, 50);
			}).each(function() {
				var t = $(this);
				if (!t.attr('autocomplete'))
					t.attr('autocomplete', 'off');
				if (!t.hasClass('unlimited')) {
					var maxlength = t.attr('maxlength');
					if (!maxlength || maxlength > 4000) {
						if (t.hasClass('date'))
							t.attr('maxlength', '10');
						else if (t.hasClass('datetime'))
							t.attr('maxlength', '19');
						else if (t.hasClass('time'))
							t.attr('maxlength', '8');
						else if (t.hasClass('integer'))
							t.attr('maxlength', t.hasClass('positive')
											? '9'
											: '10');
						else if (t.hasClass('long'))
							t.attr('maxlength', t.hasClass('positive')
											? '18'
											: '19');
						else if (t.hasClass('double'))
							t.attr('maxlength', t.hasClass('positive')
											? '21'
											: '22');
						else
							t.attr('maxlength', '255');
					}
				}
			});
	if (MODERN_BROWSER) {
		$$('input[type="checkbox"].custom,input[type="radio"].custom',
				container).each(function(i) {
			$(this).hide();
			if (!this.id)
				this.id = ('a' + (i + Math.random())).replace('.', '')
						.substring(0, 9);
			var label = $(this).next('label.custom');
			if (!label.length)
				$(this).after($('<label class="custom" for="' + this.id
						+ '"></label>'));
			else
				label.attr('for', this.id);
		});
		$$('.custom[type="file"]', container).each(function() {
			var t = $(this);
			t.hide().change(function() {
				var names = [];
				for (var i = 0; i < this.files.length; i++) {
					var f = this.files[i];
					var size = f.size;
					size = size / 1024;
					size = Math.round(size * 100) / 100;
					if (size >= 1024) {
						size = size / 1024;
						size = Math.round(size * 100) / 100;
						if (size >= 1024) {
							size = size / 1024;
							size = Math.round(size * 100) / 100;
							size = size + ' GB';
						} else {
							size = size + ' MB';
						}
					} else {
						size = size + ' KB';
					}
					names.push('<i class="tiped" title="' + size + '">'
							+ f.name + '</i>');
				}
				var files = names.join(', ');
				var fp = t.next('.filepick');
				if (files) {
					_observe(fp.find('.file-holder').html(files));
					fp.find('.remove').show();
					fp.find('.filepick-handle').hide();
				} else {
					fp.find('.file-holder').text('');
					fp.find('.remove').hide();
					fp.find('.filepick-handle').show();
				}
			});
			var fp = $('<div class="filepick"><span class="file-holder"></span><a class="remove" href="#" style="display:none;">&times;</a><span class="filepick-handle glyphicon glyphicon-list"></span></div>')
					.insertAfter(t);
			fp.find('.filepick-handle').click(function() {
						t.click();
						return false;
					});
			fp.find('a.remove').click(function() {
						t.val(null).trigger('change');
						return false;
					});
		});
	}
	$$('.linkage_switch', container).each(function() {
		var c = $(this).closest('.linkage');
		c.data('originalclass', c.attr('class'));
		$(this).on('linkage', function() {
			var c = $(this).closest('.linkage');
			var sw = $(this);
			if (sw.is(':hidden'))
				return false;
			var val = sw.val() || 'linkage_default';
			$('.linkage_component', c).each(function() {
				var t = $(this);
				var hide = t.is(':not(.' + val + ')');
				if (!hide
						&& t.closest('.linkage')[0] != sw.closest('.linkage')[0])
					hide = t.parent().closest('.linkage_component').is(':not(.'
							+ val + ')');
				if (hide) {
					t.hide();
					$$(':input:not([disabled])', t).addClass('_disabled').prop(
							'disabled', true);
				} else {
					t.show();
					$$('._disabled:input', t).removeClass('_disabled').prop(
							'disabled', false).filter('.linkage_switch').each(
							function() {
								var t = $(this);
								setTimeout(function() {
											t.change()
										}, 20);
							});
				}
			});
			c.attr('class', c.data('originalclass') + ' ' + val);
		}).change(function() {
					$(this).trigger('linkage')
				}).trigger('linkage');
	});
	$$(':input.conjunct', container).on('conjunct', function() {
		var t = $(this);
		var f = $(this).closest('form');
		var data = {};
		var url = f.prop('action');
		if (url.indexOf('/') > -1) {
			if (url.substring(url.lastIndexOf('/') + 1) == 'save')
				url = url.substring(0, url.lastIndexOf('/')) + '/input';
		} else if (url == 'save')
			url = 'input';
		var hid = $('input[type=hidden][name$=".id"]', f);
		if (hid.val())
			data['id'] = hid.val();
		$(':input.conjunct,input[type=hidden]:not(.nocheck)', f).each(
				function() {
					data[$(this).attr('name')] = $(this).val();
				});
		ajax({
					global : t.data('global'),
					preflight : true,
					quiet : true,
					async : false,
					type : t.data('method') || 'GET',
					url : url,
					data : data,
					target : f[0],
					replacement : t.data('replacement'),
					headers : {
						'X-Exact-Fragment' : '1'
					},
					beforeSend : function() {
						f.addClass('loading');
					},
					complete : function() {
						f.removeClass('loading');
					}
				});
	}).change(function() {
				var t = $(this).trigger('conjunct');
			});
	// if (typeof $.fn.datepicker != 'undefined')
	// $$('input.date:not([readonly]):not([disabled])', container).datepicker({
	// dateFormat : 'yy-mm-dd'
	// });
	if (typeof $.fn.datetimepicker != 'undefined')
		$$('input.date,input.datetime,input.time', container).not('[readonly]')
				.not('[disabled]').each(function() {
					var t = $(this);
					var option = {
						language : MessageBundle.lang().replace('_', '-')
					};
					if (t.hasClass('datetime')) {
						option.format = t.data('format')
								|| 'yyyy-MM-dd HH:mm:ss';
					} else if (t.hasClass('time')) {
						option.format = t.data('format') || 'HH:mm:ss';
						option.pickDate = false;
					} else {
						option.format = t.data('format') || 'yyyy-MM-dd';
						option.pickTime = false;
					}
					t.focus(function() {
						var dp = t.data('datetimepicker');
						if (!dp) {
							t.datetimepicker(option).on('changeDate',
									function(e) {
										t.data('changed', true);
										if (t.hasClass('date'))
											t.blur();
									});
							dp = t.data('datetimepicker');
							dp.show();
						}
					}).blur(function() {
						var dp = t.data('datetimepicker');
						if (dp) {
							if (t.data('changed'))
								t.removeData('changed').trigger('validate')
										.trigger('conjunct');
							dp.widget.remove();
							t.removeData('datetimepicker');
						}
					});
				});
	if (typeof $.fn.treeTable != 'undefined')
		$$('.treeTable', container).each(function() {
			$(this).treeTable({
				initialState : $(this).hasClass('expanded')
						? 'expanded'
						: 'collapsed'
			});
		});
	if (typeof $.fn.chosen != 'undefined')
		$$('.chosen', container).chosen({
					search_contains : true,
					placeholder_text : MessageBundle.get('select'),
					no_results_text : ' '
				});
	if (typeof $.fn.htmlarea != 'undefined')
		$$('textarea.htmlarea', container).htmlarea();
	// bootstrap start
	$$('a[data-toggle="tab"]', container).on('shown', function(e) {
				$this = $(e.target);
				var selector = $this.attr('data-target');
				if (!selector) {
					selector = $this.attr('href');
					selector = selector
							&& selector.replace(/.*(?=#[^\s]*$)/, '');
				}
				$target = $(selector);
				if ($target.hasClass('ajaxpanel'))
					$target.trigger('load');
			});
	$$('.carousel', container).each(function() {
				var t = $(this);
				t.carousel((new Function("return "
						+ (t.data('options') || '{}')))());
			});
	$$(':input[data-helpurl]', container).each(function() {
		var t = $(this);
		var href = '<a href="'
				+ t.data('helpurl')
				+ '" style="padding-left: 5px;" target="_blank"><span class="glyphicon glyphicon-question-sign"></span></a>'
		href = $(href).insertAfter(t);
		if (t.is('textarea'))
			href.find('span').css('vertical-align', 'top');
	});
	$$('.tiped', container).each(function() {
				var t = $(this);
				var options = {
					html : true,
					trigger : t.data('trigger') || t.is(':input')
							? 'focus'
							: 'hover',
					placement : t.data('placement') || t.is(':input')
							? 'right'
							: 'top'
				};
				t.tooltip(options);
			});
	$$('.poped', container).each(function() {
		var t = $(this);
		var options = {
			html : true,
			trigger : t.data('trigger') || 'hover',
			placement : t.data('placement') || 'right'
		};
		if (t.data('popurl')) {
			if (!options.content && t.data('popurl'))
				options.title = MessageBundle.get('ajax.loading');
			t.on(options.trigger == 'hover' ? 'mouseenter' : options.trigger,
					function() {
						if (!t.hasClass('_poped')) {
							t.addClass('_poped');
							$.ajax({
								url : t.data('popurl'),
								global : false,
								dataType : 'html',
								success : function(data) {
									$('div.popover').remove();
									if (data.indexOf('<title>') >= 0
											&& data.indexOf('</title>') > 0)
										t
												.attr(
														'data-original-title',
														data
																.substring(
																		data
																				.indexOf('<title>')
																				+ 7,
																		data
																				.indexOf('</title>')));
									if (data.indexOf('<body') >= 0
											&& data.indexOf('</body>') > 0)
										t
												.attr(
														'data-content',
														data
																.substring(
																		data
																				.indexOf(
																						'>',
																						data
																								.indexOf('<body')
																								+ 5)
																				+ 1,
																		data
																				.indexOf('</body>')));
									t.popover(options).popover('show');
								}
							});
						}
					});
		}
		t.popover(options);
	});
	// bootstrap end
	$$('.btn-switch', container).each(function() {
				var t = $(this);
				t.children().css('cursor', 'pointer').click(function() {
							t.children().removeClass('active').css({
										'font-weight' : 'normal'
									});
							$(this).addClass('active').css({
										'font-weight' : 'bold'
									});
						});
			});
	$$('a.popmodal', container).each(function() {
		var t = $(this);
		var id = t.attr('href');
		if (id.indexOf('/') > -1)
			id = id.substring(id.lastIndexOf('/') + 1);
		id += '_modal';
		while ($('#' + id).length)
			id += '_';
		t.click(function(e) {
			if (!$('#' + id).length) {
				$.get(t.attr('href'), function(data) {
					if (typeof data == 'object') {
						if (data.actionErrors) {
							Message.showActionError(data.actionErrors);
						} else {
							console.log(JSON.stringify(data));
						}
					} else {
						var html = data
								.replace(/<script(.|\s)*?\/script>/g, '');
						var div = $('<div/>').html(html);
						var modal = $('<div class="modal pop hide fade in"><div class="modal-header"><h3 style="text-align:center;"></h3></div><div class="modal-body"></div></div>')
								.appendTo(document.body);
						modal.attr('id', id);
						var modalwidth = t.data('modalwidth');
						if (modalwidth)
							modal.width(modalwidth);
						modal.find('.modal-header h3').append($('title', div)
								.html());
						modal.find('.modal-body').append($('#content', div)
								.html());
						if (!modal.find('.custom-dialog-close').length)
							modal
									.find('.modal-header')
									.prepend('<a class="close" data-dismiss="modal">&times;</a>');
						_observe(modal);
						$('form', modal).each(function() {
									this.onsuccess = function() {
										modal.modal('hide');
									};
								});
						t.data('originalhref', t.attr('href')).attr('href',
								'#' + id).attr('data-toggle', 'modal');
						modal.modal('show');
						if (t.hasClass('nocache'))
							modal.on('hidden', function() {
										t.attr('href', t.data('originalhref'));
										$(this).remove();
									})
					}
				});
			} else {
				$('#' + id).modal('show');
			}
			return false;
		});

	});
	if (typeof swfobject != 'undefined') {
		$$('.chart', container).each(function() {
			var t = $(this);
			var id = t.attr('id');
			var width = t.width();
			var height = t.height();
			var data = t.data('url');
			if (data.indexOf('/') == 0)
				data = document.location.protocol + '//'
						+ document.location.host + data;
			if (!id || !width || !height || !data)
				alert('id,width,height,data all required');
			swfobject.embedSWF(CONTEXT_PATH
							+ '/assets/images/open-flash-chart.swf', id, width,
					height, '9.0.0', CONTEXT_PATH
							+ '/assets/images/expressInstall.swf', {
						'data-file' : encodeURIComponent(data),
						'loading' : MessageBundle.get('ajax.loading')
					}, {
						wmode : 'transparent'
					});
			if (t.hasClass('intervaled')) {
				t.removeClass('intervaled');
				clearInterval(parseInt(t.data('_interval')));
			}
			if (t.data('interval')) {
				var _interval = setInterval(function() {
							if (t.data('quiet')) {
								$.ajax({
											global : false,
											url : data,
											dataType : 'text',
											success : function(json) {
												document.getElementById(id)
														.load(json);
											}
										});
							} else {
								document.getElementById(id).reload(data);
							}
						}, parseInt(t.data('interval')));
				t.addClass('intervaled').data('_interval', _interval);
			}
		});

		window.save_image = function() {
			var content = [];
			content
					.push('<html><head><title>Charts: Export as Image<\/title><\/head><body>');
			$('object[data]').each(function() {
				content.push('<img src="data:image/png;base64,'
						+ this.get_img_binary() + '"/>');
			});
			content.push('<\/body><\/html>');
			var img_win = window.open('', '_blank');
			img_win.document.write(content.join(''));
			img_win.document.close();
		}
	}
	$$('a.ajax,form.ajax', container).each(function() {
		var target = this;
		var _opt = ajaxOptions({
					url : this.tagName == 'FORM' ? this.action : this.href,
					target : target,
					onsuccess : function(data, xhr) {
						var headers = xhr.getAllResponseHeaders().split('\n');
						$.each(headers, function(i, v) {
									var name = v.split(':')[0];
									if (name.indexOf('X-Postback') == 0) {
										$(
												'[name="'
														+ name
																.substring(name
																		.lastIndexOf('-')
																		+ 1)
														+ '"]', target).val(xhr
												.getResponseHeader(name));
									}
								});
					}
				});
		if (this.tagName == 'FORM') {
			var options = {
				beforeSerialize : function() {
					$('.action-error').remove();
					if (!Form.validate(target))
						return false;
					if (!Ajax.fire(target, 'onprepare'))
						return false;
					var t = $(target);
					var dc = t.hasClass('double-check');
					var cp = t.hasClass('current-password');
					if (dc && !t.find('[name="doubleCheckUsername"]').length
							|| cp && !t.find('[name="currentPassword"]').length) {
						var modal = $('<div class="modal"><div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3 style="text-align:center;">'
								+ MessageBundle.get(dc
										? 'double.check'
										: '&nbsp;')
								+ '</h3></div><div class="modal-body"><fieldset class="form-horizontal"><div class="form-actions"><button type="submit" class="btn btn-primary">'
								+ MessageBundle.get('confirm')
								+ '</button></div></fieldset></div></div>')
								.appendTo(target);
						if (dc) {
							modal
									.find('.form-horizontal')
									.prepend('<div class="control-group"><label class="control-label" for="doubleCheckUsername">'
											+ MessageBundle
													.get('double.check.username')
											+ '</label><div class="controls"><input id="doubleCheckUsername" type="text" name="doubleCheckUsername" class="required" autocomplete="off"></div></div><div class="control-group"><label class="control-label" for="doubleCheckPassword">'
											+ MessageBundle
													.get('double.check.password')
											+ '</label><div class="controls"><input id="doubleCheckPassword" type="password" name="doubleCheckPassword" class="required" autocomplete="off"></div></div>');
						} else {
							modal
									.find('.form-horizontal')
									.prepend('<div class="control-group"><label class="control-label" for="currentPassword">'
											+ MessageBundle
													.get('current.password')
											+ '</label><div class="controls"><input id="currentPassword" type="password" name="currentPassword" class="required" autocomplete="off"></div></div>');
						}
						modal.on('shown', function() {
									$('.modal-backdrop').insertAfter(this);
								}).on('hidden', function() {
									$(this).remove();
								}).modal('show');
						return false;
					}
					Ajax.fire(target, 'onbeforeserialize');
				},
				beforeSubmit : function() {
					Indicator.text = $(target).data('indicator');
					$(':submit:not(:disabled)', target).prop('disabled', true)
							.addClass('loading');
					Ajax.fire(target, 'onloading');
					var form = $(target);
					var pushstate = false;
					if (form.hasClass('history'))
						pushstate = true;
					if (options.pushState === false
							|| form.parents('.ui-dialog,.tab-content').length)
						pushstate = false;
					if (pushstate && HISTORY_ENABLED) {
						var url = form.prop('action');
						var index = url.indexOf('://');
						if (index > -1) {
							url = url.substring(index + 3);
							url = url.substring(url.indexOf('/'));
						}
						var params = form.serializeArray();
						var realparams = [];
						if (params) {
							$.map(params, function(v, i) {
										if (v.name == 'resultPage.pageNo')
											v.name = 'pn';
										else if (v.name == 'resultPage.pageSize')
											v.name = 'ps';
										if (!(v.name == 'check'
												|| v.name == 'keyword'
												&& !v.value || v.name == 'pn'
												&& v.value == '1' || v.name == 'ps'
												&& v.value == '10'))
											realparams.push({
														name : v.name,
														value : v.value
													});

									});
							var param = $.param(realparams);
							if (param)
								url += (url.indexOf('?') > 0 ? '&' : '?')
										+ param;
						}
						var location = document.location.href;
						if (HISTORY_ENABLED) {
							history.replaceState({
										url : location
									}, '', location);
							history.pushState(url, '', url);
						}
					}
					if (Ajax.fire(target, 'onbeforesubmit') === false)
						return false;
				},
				beforeSend : function() {
					if (typeof $.fn.mask != 'undefined'
							&& !$(target).data('quiet')) {
						var replacement = $(target).attr('data-replacement');
						if (replacement) {
							$.each(replacement.split(','), function(i, v) {
										if (v.indexOf(':') > -1)
											v = v.substring(0, v.indexOf(':'));
										$('#' + v).mask();
									});
							$(target).addClass('loading');
						} else {
							$(target).mask();
						}
					} else {
						$(target).addClass('loading');
					}
				},
				error : function() {
					Form.focus(target);
					Ajax.fire(target, 'onerror');
				},
				success : function(data, textStatus, xhr) {
					var t = $(target);
					if (t.hasClass('double-check')) {
						if (!data.fieldErrors
								|| !(data.fieldErrors['doubleCheckUsername'] || data.fieldErrors['doubleCheckPassword'])) {
							t.find('.modal').find('a.close').click();
						}
					}
					if (t.hasClass('current-password')) {
						if (!data.fieldErrors
								|| !(data.fieldErrors['currentPassword'])) {
							t.find('.modal').find('a.close').click();
						}
					}
					Ajax.handleResponse(data, _opt, xhr);
				},
				complete : function() {
					if (typeof $.fn.mask != 'undefined'
							&& !$(target).data('quiet')) {
						var replacement = $(target).attr('data-replacement');
						if (replacement) {
							$.each(replacement.split(','), function(i, v) {
										if (v.indexOf(':') > -1)
											v = v.substring(0, v.indexOf(':'));
										$('#' + v).unmask();
									});
							$(target).removeClass('loading');
						} else {
							$(target).unmask();
						}
					} else {
						$(target).removeClass('loading');
					}
					if (!$(target).hasClass('disposed')) {
						$('.loading', target).prop('disabled', false)
								.removeClass('loading');
						Captcha.refresh();
					}
				},
				headers : _opt.headers
			};
			if (!$(this).hasClass('view'))
				$.extend(options.headers, {
							'X-Data-Type' : 'json'
						});
			$(this).on('submit', function(e) {
				var form = $(this);
				var btn = $('.clicked', form);
				if (!btn.length)
					btn = $(':input:submit:focus', form);
				if (btn.hasClass('noajax'))
					return true;
				var confirm = btn.hasClass('confirm');
				if (btn.hasClass('reload') || btn.data('action')) {
					options.pushState = false;
					confirm = false;
				}
				var func = function() {
					if ('multipart/form-data' == form.attr('enctype')) {
						options.target = target;
						$.ajaxupload(options);
					} else {
						form.ajaxSubmit(options);
					}
					btn.removeClass('clicked');
				}
				if (confirm) {
					$.alerts.confirm((btn.data('confirm') || MessageBundle
									.get('confirm.action')), MessageBundle
									.get('select'), function(b) {
								if (b) {
									func();
								} else {
									btn.removeClass('clicked');
								}
							});
				} else {
					func();
				}
				return false;
			});
			return;
		} else {
			$(this).click(function() {
				if (!Ajax.fire(target, 'onprepare'))
					return false;
				if ($(this).is('ul.nav li a')) {
					$('li', $(this).closest('.nav')).removeClass('active');
					Nav.indicate($(this));
				}
				var addHistory = HISTORY_ENABLED
						&& $(this).hasClass('view')
						&& !$(this).hasClass('nohistory')
						&& ($(this).hasClass('history') || !($(this)
								.data('replacement')));
				if (addHistory) {
					$('.ui-dialog:visible').children().remove();
					var hash = this.href;
					if (UrlUtils.isSameDomain(hash)) {
						hash = hash.substring(hash.indexOf('://') + 3);
						hash = hash.substring(hash.indexOf('/'));
						if (HISTORY_ENABLED) {
							var location = document.location.href;
							history.replaceState({
										url : location
									}, '', location);
							history.pushState({
										replacement : $(this)
												.data('replacement'),
										url : hash
									}, '', hash);
						}
					}

				}
				var t = $(this);
				var options = {
					target : this,
					url : this.href,
					type : $(this).data('method') || 'GET',
					cache : $(this).hasClass('cache'),
					beforeSend : function() {
						if (typeof $.fn.mask != 'undefined'
								&& t.hasClass('view') && !t.data('quiet')) {
							var replacement = t.attr('data-replacement')
									|| Ajax.defaultRepacement;
							$.each(replacement.split(','), function(i, v) {
										if (v.indexOf(':') > -1)
											v = v.substring(0, v.indexOf(':'));
										$('#' + v).mask();
									});
						}
						t.addClass('loading');
						$('.action-error').remove();
						Indicator.text = $(target).data('indicator');
						Ajax.fire(target, 'onloading');
					},
					error : function() {
						Ajax.fire(target, 'onerror');
					},
					complete : function() {
						if (typeof $.fn.mask != 'undefined'
								&& t.hasClass('view') && !t.data('quiet')) {
							var replacement = t.attr('data-replacement')
									|| Ajax.defaultRepacement;
							$.each(replacement.split(','), function(i, v) {
										$('#' + v).unmask();
									});
						}
						t.removeClass('loading');
					}
				};
				if (!$(this).hasClass('view'))
					$.extend(options.headers, {
								'X-Data-Type' : 'json'
							});
				else if (!$(this).data('replacement'))
					options.replaceTitle = true;
				if (addHistory)
					options.onsuccess = function() {
						Nav.activate(options.url);
					};
				ajax(options);
				return false;
			});
		}
	});
};

var Nav = {
	init : function() {
		$(document).on('click', '.nav:not(.nav-tabs) li a', function() {
					$('li', $(this).closest('.nav')).removeClass('active');
					Nav.indicate($(this));
				}).on('click', '.tab-content .tab-pane button[class*="step-"]',
				function() {
					var tabid = $(this).closest('.tab-pane').attr('id');
					var tab = $(this).closest('.tab-content').prev('.nav-tabs')
							.find('a[href$="#' + tabid + '"]').parent();
					tab = $(this).hasClass('step-next') ? tab.next() : tab
							.prev();
					tab.find('a').click();
				});
	},
	activate : function(url) {
		url = UrlUtils.absolutize(url);
		$('.nav:not(.nav-tabs) li').removeClass('active open');
		$('.nav:not(.nav-tabs) li a').each(function() {
					if (this.href == url || url.indexOf(this.href + '?') == 0) {
						Nav.indicate($(this));
					}
				});
	},
	indicate : function(a) {
		if (a.is('.accordion-inner > .nav-list > li > a')
				&& !a.closest('.accordion-body').hasClass('in'))
			a.closest('.accordion-group').find('.accordion-toggle').click();
		var dropdown = a.closest('li.dropdown');
		if (!dropdown.length) {
			$(a).closest('li').addClass('active');
			$('#nav-breadcrumb').remove();
			return;
		}
		if (a.hasClass('dropdown-toggle'))
			return;
		dropdown.addClass('active');
		var nb = $('#nav-breadcrumb');
		if (nb.length)
			nb.html('');
		else
			nb = $('<ul id="nav-breadcrumb" class="breadcrumb"/>')
					.prependTo($('#content'));
		nb.append('<li>' + dropdown.children('a').text()
				+ ' <span class="divider">/</span></li>')
				.append('<li class="active">' + a.text() + '</li>');
	}
}

var Dialog = {
	adapt : function(d, iframe) {
		try {
			var useiframe = iframe != null;
			var hasRow = false;
			var hasToolbarPagination = false;
			var datagridColumns = 0;
			var hideCloseButton = false;
			if (!iframe) {
				$(d).dialog('option', 'title', Ajax.title);
				hasRow = $('div[class*="row"]', d).length > 0;
				hasToolbarPagination = $(
						'form.richtable div.toolbar select.pageSize', d).length > 0;
				$('.controls > table', d).each(function() {
					var i = $(this).find('tbody tr:eq(0)').find('td').length
							- 1;
					if (datagridColumns < i)
						datagridColumns = i;
				});
				hideCloseButton = d.find('.custom-dialog-close').length;
			} else {
				var doc = iframe.document;
				if (iframe.contentDocument) {
					doc = iframe.contentDocument;
				} else if (iframe.contentWindow) {
					doc = iframe.contentWindow.document;
				}
				$(d).dialog('option', 'title', doc.title);
				$(d).dialog('option', 'minHeight', height);
				var height = $(doc).height() + 20;
				$(iframe).height(height);
				hasRow = $('div.row', doc).length > 0;
				hasToolbarPagination = $(
						'form.richtable div.toolbar select.pageSize', doc).length > 0;
				$('.controls > table', doc).each(function() {
					var i = $(this).find('tbody tr:eq(0)').find('td').length
							- 1;
					if (datagridColumns < i)
						datagridColumns = i;
				});
				hideCloseButton = $(doc).find('.custom-dialog-close').length;
			}
			d.dialog('moveToTop');
			if (!(d.data('windowoptions') && d.data('windowoptions').width)) {
				if ((hasRow || hasToolbarPagination)) {
					d.dialog('option', 'width', $(window).width() > 1345
									? '90%'
									: ($(window).width() > 1210
											? '95%'
											: '100%'));
				} else if (datagridColumns > 1) {
					d.dialog('option', 'width', datagridColumns < 3
									? '60%'
									: (datagridColumns < 4
											? '80%'
											: (datagridColumns < 5
													? '90%'
													: "98%")));
				}
			}
			if (hideCloseButton)
				$('.ui-dialog-titlebar-close', d.closest('.ui-dialog')).hide();
			var height = d.outerHeight();
			if (height >= $(window).height()) {
				d.dialog('option', 'position', {
							my : 'top',
							at : 'top',
							of : window
						});
			} else {
				d.dialog('option', 'position', {
							my : 'center',
							at : 'center',
							of : window
						});
			}
		} catch (e) {
			console.log(e);
		}
	},
	toggleMaximization : function(d) {
		var dialog = $(d).closest('.ui-dialog');
		var orginalWidth = dialog.data('orginal-width');
		if (orginalWidth) {
			dialog.width(orginalWidth);
			dialog.height(dialog.data('orginal-height'));
			dialog.removeData('orginal-width').removeData('orginal-height');
			Dialog.adapt($(d));
		} else {
			dialog.data('orginal-width', dialog.width() + 0.2).data(
					'orginal-height', dialog.height() + 0.2);
			var viewportWidth = $(window).width() - 10;
			var viewportHeight = $(window).height() - 10;
			dialog.outerWidth(viewportWidth);
			if (dialog.outerHeight() < viewportHeight)
				dialog.outerHeight(viewportHeight);
			d.dialog('option', 'position', {
						my : 'top',
						at : 'top',
						of : window
					});
		}
	}
}

Captcha = {
	refresh : function() {
		var r = Math.random();
		$('img.captcha').each(function() {
					var src = this.src;
					var i = src.lastIndexOf('&');
					if (i > 0)
						src = src.substring(0, i);
					this.src = src + '&' + r;
				});
		$('input.captcha').val('').focus();
	}
};
DateUtils = {
	humanRead : function(date) {
		if (typeof date == 'string') {
			var string = date;
			date = new Date(date);
			if (isNaN(date.getTime())) {
				var arr = string.split(' ');
				date = new Date(arr[0]);
				string = arr[1];
				arr = string.split(':');
				date.setHours(parseInt(arr[0]));
				date.setMinutes(parseInt(arr[1]));
				date.setSeconds(parseInt(arr[2]));
			}
		}
		var now = new Date();
		var delta = now.getTime() - date.getTime();
		var before = (delta >= 0);
		delta = delta < 0 ? -delta : delta;
		delta /= 1000;
		var s;
		if (delta <= 60) {
			return "1分钟内";
		} else if (delta < 3600) {
			delta = Math.floor(delta / 60);
			if (delta == 30)
				s = "半个小时";
			else
				s = delta + "分钟";
		} else if (delta < 86400) {
			var d = delta / 3600;
			var h = Math.floor(d);
			var m = (d - h) * 3600;
			m = Math.floor(m / 60);
			if (m == 0)
				s = h + "个小时";
			else if (m == 30)
				s = h + "个半小时";
			else
				s = h + "个小时" + m + "分钟";
		} else if (delta < 2592000) {
			s = Math.floor(delta / 86400) + "天";
		} else if (delta < 31104000) {
			s = Math.floor(delta / 2592000) + "个月";
		} else {
			s = Math.floor(delta / 3110400) / 10 + "年";
		}
		return s + (before ? "前" : "后");

	},
	addDays : function(date, days) {
		var string = false;
		if (typeof date == 'string') {
			string = true;
			date = new Date(date);
		}
		var time = date.getTime();
		time += (24 * 3600 * 1000) * days;
		date = new Date();
		date.setTime(time);
		return string ? $.format.date(date, 'yyyy-MM-dd') : date;
	},
	getIntervalDays : function(startDate, endDate) {
		if (typeof startDate == 'string')
			startDate = new Date(startDate);
		if (typeof endDate == 'string')
			endDate = new Date(endDate);
		var diff = endDate.getTime() - startDate.getTime();
		return diff / (24 * 3600 * 1000) + 1;
	},

	isLeapYear : function(year) {
		return new Date(year, 1, 29).getMonth() == 1;
	},
	nextLeapDay : function(since) {
		if (typeof since == 'string')
			since = new Date(since);
		var year = since.getFullYear();
		if (DateUtils.isLeapYear(year)) {
			var leapDay = new Date(year, 1, 29);
			if (since.getTime() <= leapDay.getTime())
				return leapDay;
		}
		while (!DateUtils.isLeapYear(++year)) {
		};
		return new Date(year, 1, 29);
	},

	isSpanLeapDay : function(startDate, endDate) {
		if (typeof startDate == 'string')
			startDate = new Date(startDate);
		if (typeof endDate == 'string')
			endDate = new Date(endDate);
		return endDate.getTime() >= DateUtils.nextLeapDay(startDate).getTime();
	}
};