(function($) {
	
	elFinder.prototype.ui = function(fm, el) {
		var self = this,
			/**
			 * Bind some shortcuts to keypress instead of keydown
			 * Required for procces repeated key in ff and for opera 
			 *
			 * @type Boolean
			 */
			keypress = $.browser.mozilla || $.browser.opera,
			/**
			 * Shortcuts config
			 *
			 * @type Array
			 */
			shortcuts = [
				{
					pattern     : 'arrowLeft',
					description : 'Select file on left or last file',
					callback    : function() { move('left'); },
					keypress    : keypress
				},
				{
					pattern     : 'arrowUp',
					description : 'Select file upside then current',
					callback    : function() { move('up'); },
					keypress    : keypress
				},
				{
					pattern     : 'arrowRight',
					description : 'Select file on right or first file',
					callback    : function() { move('right'); },
					keypress    : keypress
				},
				{
					pattern     : 'arrowDown',
					description : 'Select file downside then current',
					callback    : function() { move('down'); },
					keypress    : keypress
				},
				{
					pattern     : 'shift+arrowLeft',
					description : 'Append file on left to selected',
					callback    : function() { move('left', true); },
					keypress    : keypress
				},
				{
					pattern     : 'shift+arrowUp',
					description : 'Append upside file to selected',
					callback    : function() { move('up', true); },
					keypress    : keypress
				},
				{
					pattern     : 'shift+arrowRight',
					description : 'Append file on right to selected',
					callback    : function() { move('right', true); },
					keypress    : keypress
				},
				{
					pattern     : 'shift+arrowDown',
					description : 'Append downside file to selected',
					callback    : function() { move('down', true); },
					keypress    : keypress
				},
				{
					pattern     : 'ctrl+arrowDown',
					description : 'Open directory or file',
					callback    : function() { 
							if (fm.selected.length == 1 && fm.selected[0].mime == 'directory') {
								fm.cd(fm.selected[0].hash)
							} else if (fm.selected.length) {
								fm.exec('open', fm.selected)
							}
						}
				},
				{
					pattern     : 'ctrl+a',
					description : 'Select all files',
					callback    : function() { 
							self.select('all')
						}
				},
				{
					pattern     : 'ctrl+arrowLeft',
					description : 'Return to previous directory',
					callback    : function() { fm.back(); }
				},
				{
					pattern     : 'enter',
					description : 'Open directory or file',
					callback    : function() { 
							if (fm.selected.length == 1 && fm.selected[0].mime == 'directory') {
								fm.cd(fm.selected[0].hash)
							} else if (fm.selected.length) {
								fm.exec('open', fm.selected)
							}
						}
				},
				{
					pattern : 'ctrl+shift+r',
					description : 'Reload current directory',
					callback : function() { fm.reload(); }
				},
				{
					pattern     : 'ctrl+c',
					description : 'Copy',
					callback    : function() { fm.copy(fm.selected); }
				},
				{
					pattern     : 'ctrl+x',
					description : 'Cut',
					callback    : function() { fm.cut(fm.selected); }
				},
				{
					pattern     : 'ctrl+v',
					description : 'Paste',
					callback    : function() { fm.paste(); }
				},
				{
					pattern     : 'delete',
					description : 'Delete files',
					callback    : function() { fm.rm(); }
				},
				{
					pattern     : 'ctrl+backspace',
					description : 'Delete files',
					callback    : function() { fm.rm(); }
				},
			],
			/**
			 * Return css class and element to display permissions, based on object permissions
			 *
			 * @param Object  file/dir object
			 * @return void
			 */
			perms = function(o) {
				var c = '', e = '';
			
				if (!o.read && !o.write) {
					c = 'elfinder-na';
					e = '<span class="elfinder-perms"/>';
				} else if (!o.read) {
					c = 'elfinder-wo';
					e = '<span class="elfinder-perms"/>';
				} else if (!o.write) {
					c = 'elfinder-ro';
					e = '<span class="elfinder-perms"/>';
				}
				return { cssclass : c, element : e };
			},
			/**
			 * Return element to display what file is simplink
			 *
			 * @param Object  file/dir object
			 * @return String
			 */
			symlink = function(o) {
				return o.link || o.mime == 'symlink-broken' ? '<span class="elfinder-symlink"/>' : ''
			},
			/**
			 * Move selection to prev/next file
			 *
			 * @param String  move direction
			 8 @param Boolean append to current selection
			 * @return String
			 * @rise select			
			 */
			move = function(dir, append) {
				var cwd = self.cwd,
					prev = dir == 'left' || dir == 'up',
					selector = prev ? 'first' : 'last',
					list = fm._view == 'list',
					s, n, top, left;
				
				if (fm.selected.length) {
					// find fist/last selected file
					s = cwd.find('[id].ui-selected:'+(prev ? 'first' : 'last'));
					
					if (!s[prev ? 'prev' : 'next']('[id]').length) {
						// there is no sibling on required side - do not move selection
						n = s;
					} else if (list || dir == 'left' || dir == 'right') {
						// find real prevoius file
						n = s[prev ? 'prev' : 'next']('[id]');
					} else {
						// find up/down side file in icons view
						top = s.position().top;
						left = s.position().left;

						n = s;
						if (prev) {
							do {
								n = n.prev('[id]');
							} while (n.length && !(n.position().top < top && n.position().left <= left))
							
						} else {
							do {
								n = n.next('[id]');
							} while (n.length && !(n.position().top > top && n.position().left >= left))
							// there is row before last one - select last file
							if (!n.length && cwd.find('[id]:last').position().top > top) {
								n = cwd.find('[id]:last');
							}
						}
					}
					
				} else {
					// there are no selected file - select first/last one
					n = cwd.find('[id]:'+(prev ? 'last' : 'first'))
				}
				
				// new file to select exists
				if (n && n.length) {

					if (append) {
						// append new files to selected
						// found strange bug in ff - prevUntil/nextUntil by id not always returns correct set >_< wtf?
						n = s.add(s[prev ? 'prevUntil' : 'nextUntil']($.browser.mozilla ? '[id="'+n.attr('id')+'"]' : '#'+n.attr('id'))).add(n);
					} else {
						// unselect selected files
						$.each(fm.selected, function() {
							cwd.find('#'+this.hash).removeClass('ui-selected');
						});
					}
					// select file(s)
					n.addClass('ui-selected');
					// set its visible
					scrollToView(n.filter(prev ? ':first' : ':last'));
					// update cache/view
					self.select();
				}
				
			},
			/**
			 * Scroll file to set it visible
			 *
			 * @param DOMElement  file/dir node
			 * @return void
			 */
			scrollToView = function(o) {
				var cwd = self.cwd,
					t   = o.position().top;
					h   = o.outerHeight(true);
					ph  = cwd.innerHeight();
					st  = cwd.scrollTop();
				
				if (t < 0) {
					cwd.scrollTop(Math.ceil(t + st) - 9);
				} else if (t + h > ph) {
					cwd.scrollTop(Math.ceil(t + h - ph + st));
				}
			},
			/**
			 * Copy/cut files and paste after drag&drop
			 *
			 * @param Event  file/dir node
			 * @param Object ui object
			 * @param String destination dir hash
			 * @return void
			 */
			drop = function(e, ui, dst) {
				var files = ui.helper.data('files') || [],
					l = files.length,
					cut = !e.shiftKey;
					
				if (l) {
					fm.copy(files, cut);
					// to avoid jquery.ui bug when drop folder from nav tree
					setTimeout(function() {
						fm.paste(dst);
					}, 300);
					while (l--) {
						if (!files[l].read || (cut && !files[l].rm)) {
							return;
						}
					}
					ui.helper.hide();
				}
			},
			hclass = 'ui-state-hover',
			sclass = 'ui-selected',
			
			draggable = {
				revert     : true,
				addClasses : false,
				cursor     : 'move',
				cursorAt   : {left : 50, top : 47},
				refreshPositions : true,
				drag : function(e, ui) { ui.helper.toggleClass('elfinder-drag-helper-plus', e.shiftKey); }
			},
			draggableCwd = $.extend({}, draggable, {
				start : function() { fm.log('start') },
				helper : function() {
					var s = fm.selected,
						l = s.length,
						h = $('<div class="elfinder-drag-helper"/>').data('files', s);
					fm.log('helper')
					function icon(f) {
						return $('<span class="elfinder-drag-icon '+self.mime2class(f.mime)+'">')
							.append(
								fm._view != 'list' && f.mime.indexOf('image/') === 0 
									? self.cwd.find('#'+f.hash).children('.elfinder-cwd-icon').clone() 
									: '<span class="elfinder-cwd-icon"/>'
							);
					}
					
					if (l) {
						h.append(icon(s[0]));
						l > 1 && h.append(icon(s[l-1])).append('<span class="elfinder-drag-num">'+l+'</span>');
					}
					return h;
				}
			}),
			draggableNav = $.extend({}, draggable, {
				start : function(e) {
					if ($(e.target).hasClass('elfinder-nav-home')) {
						e.preventDefault();
					}
				},
				helper : function() {
					var data = {
						hash  : $(this).attr('key'),
						name  : $(this).text(),
						read  : true,
						write : true,
						rm    : true,
						mime  : 'directory'
					};
					
					return $('<div class="elfinder-drag-helper"/>')
						.data('files', [data])
						.append('<span class="elfinder-drag-icon directory"><span class="elfinder-cwd-icon"/></span>');
				}
			})
			;

		/**
		 * elFinder instance
		 * 
		 * @type  elFinder
		 */
		this.fm = fm;
		

		
		/**
		 * File mimetype to kind mapping
		 * 
		 * @type  Object
		 */
		this.kinds = {
			'unknown'                       : 'Unknown',
			'directory'                     : 'Folder',
			'symlink'                       : 'Alias',
			'symlink-broken'                : 'Broken alias',
			'application/x-empty'           : 'Plain text',
			'application/postscript'        : 'Postscript document',
			'application/octet-stream'      : 'Application',
			'application/vnd.ms-office'     : 'Microsoft Office document',
			'application/vnd.ms-word'       : 'Microsoft Word document',  
		    'application/vnd.ms-excel'      : 'Microsoft Excel document',
			'application/vnd.ms-powerpoint' : 'Microsoft Powerpoint presentation',
			'application/pdf'               : 'Portable Document Format (PDF)',
			'application/vnd.oasis.opendocument.text' : 'Open Office document',
			'application/x-shockwave-flash' : 'Flash application',
			'application/xml'               : 'XML document', 
			'application/x-bittorrent'      : 'Bittorrent file',
			'application/x-7z-compressed'   : '7z archive',
			'application/x-tar'             : 'TAR archive', 
		    'application/x-gzip'            : 'GZIP archive', 
		    'application/x-bzip2'           : 'BZIP archive', 
		    'application/zip'               : 'ZIP archive',  
		    'application/x-rar'             : 'RAR archive',
			'application/javascript'        : 'Javascript application',
			'text/plain'                    : 'Plain text',
		    'text/x-php'                    : 'PHP source',
			'text/html'                     : 'HTML document', 
			'text/javascript'               : 'Javascript source',
			'text/css'                      : 'CSS style sheet',  
		    'text/rtf'                      : 'Rich Text Format (RTF)',
			'text/rtfd'                     : 'RTF with attachments (RTFD)',
			'text/x-c'                      : 'C source', 
			'text/x-c++'                    : 'C++ source', 
			'text/x-shellscript'            : 'Unix shell script',
		    'text/x-python'                 : 'Python source',
			'text/x-java'                   : 'Java source',
			'text/x-ruby'                   : 'Ruby source',
			'text/x-perl'                   : 'Perl script',
		    'text/xml'                      : 'XML document', 
			'image/x-ms-bmp'                : 'BMP image',
		    'image/jpeg'                    : 'JPEG image',   
		    'image/gif'                     : 'GIF Image',    
		    'image/png'                     : 'PNG image',
			'image/x-targa'                 : 'TGA image',
		    'image/tiff'                    : 'TIFF image',   
		    'image/vnd.adobe.photoshop'     : 'Adobe Photoshop image',
			'audio/mpeg'                    : 'MPEG audio',  
			'audio/midi'                    : 'MIDI audio',
			'audio/ogg'                     : 'Ogg Vorbis audio',
			'audio/mp4'                     : 'MP4 audio',
			'audio/wav'                     : 'WAV audio',
			'video/x-dv'                    : 'DV video',
			'video/mp4'                     : 'MP4 video',
			'video/mpeg'                    : 'MPEG video',  
			'video/x-msvideo'               : 'AVI video',
			'video/quicktime'               : 'Quicktime video',
			'video/x-ms-wmv'                : 'WM video',   
			'video/x-flv'                   : 'Flash video',
			'video/x-matroska'              : 'Matroska video'
		}
		
		/**
		 * Tolbar
		 * 
		 * @type  jQuery
		 */
		this.toolbar = $('<div class="ui-helper-clearfix ui-widget-header ui-corner-all elfinder-toolbar"/>');
		
		/**
		 * Directories tree
		 * 
		 * @type  jQuery
		 */
		this.tree = $('<ul/>').elfindertree(fm);
		
		/**
		 * Places
		 * 
		 * @type  jQuery
		 */
		this.places = $('<ul class="elfinder-tree"/>');
		
		/**
		 * Navigation panel
		 * 
		 * @type  jQuery
		 */
		this.nav = $('<div class="ui-state-default elfinder-nav"/>').append(this.tree);
		
		/**
		 * Current working directory panel
		 * 
		 * @type  jQuery
		 */
		this.cwd = $('<div/>').elfindercwd(fm);
			// .selectable({
			// 	filter : '[id]',
			// 	start  : function() { fm.trigger('focus'); },
			// 	stop   : function() { self.select(); }
			// })
			// .bind('contextmenu', function(e) {
			// 	
			// 	fm.log(e.target)
			// 	
			// })
			;
		
		
		/**
		 * Nav and cwd container
		 * 
		 * @type  jQuery
		 */
		this.workzone = $('<div class="ui-helper-clearfix elfinder-workzone"/>').append(this.nav).append(this.cwd)
		
		
		/**
		 * Ajax spinner
		 * 
		 * @type  jQuery
		 */
		this.spinner = $('<div class="elfinder-spinner"/>');
		
		/**
		 * Overlay
		 * 
		 * @type  jQuery
		 */
		this.overlay = $('<div class="ui-widget-overlay elfinder-overlay"/>');
		
		/**
		 * Error message place
		 * 
		 * @type  jQuery
		 */
		this.errorMsg = $('<div/>');
		
		/**
		 * Error message container
		 * 
		 * @type  jQuery
		 */
		this.error = $('<div class="ui-state-error ui-corner-all elfinder-error"><span class="ui-icon ui-icon-close"/><span class="ui-icon ui-icon-alert"/><strong>'+fm.i18n('Error')+'!</strong></div>')
			.append(this.errorMsg)
			.click(function() { self.error.hide() });
		
		/**
		 * Statusbar
		 * 
		 * @type  jQuery
		 */
		this.statusbar = $('<div class="ui-widget-header ui-corner-all elfinder-statusbar"/>');
		
		/**
		 * Common elFinder container
		 * 
		 * @type  jQuery
		 */
		this.viewport = el.empty()
			.attr('id', fm.id)
			.addClass('ui-helper-reset ui-helper-clearfix ui-widget ui-widget-content ui-corner-all elfinder elfinder-'+fm.dir+' '+(fm.options.cssClass||''))
			.append(this.toolbar.hide())
			.append(this.workzone)
			.append(this.overlay.hide())
			.append(this.spinner)
			.append(this.error)
			.append(this.statusbar.hide())
			.click(function(e) {
				e.stopPropagation();
				fm.trigger('focus');
			})
			;
	
		
		this.draggable = {
			revert     : true,
			addClasses : false,
			appendTo : self.cwd,
			cursor     : 'move',
			cursorAt   : {left : 50, top : 47},
			refreshPositions : true,
			drag : function(e, ui) { ui.helper.toggleClass('elfinder-drag-helper-plus', e.shiftKey); },
			// stop : function() { fm.log('stop') },
			helper : function(e, ui) {
				var nav = this.id.indexOf('nav-') === 0,
					src = nav ? $(this).parent('li').parent('ul').prev('a').attr('id').substr(4) : fm.cwd.hash,
					f = nav 
						? [{hash : this.id.substr(4), name : $.trim($(this).text()), mime : 'directory', read : true, write : true, rm : true}] 
						: self.fm.selected,
					l = f.length,
					h = $('<div class="elfinder-drag-helper"/>').data('files', f).data('src', src),
					icon = function(f) {
						return $('<span class="elfinder-drag-icon '+self.mime2class(f.mime)+'"><span class="elfinder-cwd-icon"/></span>')
					};
				
				l > 0 && h.append(icon(f[0]));
				l > 1 && h.append(icon(f[l-1])).append('<span class="elfinder-drag-num">'+l+'</span>');	

				return h;
			}
		}
		
	
		// bind events handlers
		fm.bind('ajaxstart ajaxstop ajaxerror', function(e) {
			self.spinner[e.type == 'ajaxstart' ? 'show' : 'hide']();
			self.error.hide();
		})
		.bind('lock', function(e) {
			self.overlay[fm.locks.ui ? 'show' : 'hide']();
		})
		.bind('error ajaxerror', function(e) {
			self.errorMsg.text(fm.i18n(e.data.error));
			self.error.fadeIn('slow');
			setTimeout(function() { 
				self.error.fadeOut('slow');
			}, 4000);
		})
		.bind('cd', function(e) {
			if (e.data.cdc) {
				// render tree and add events handlers
				// e.data.tree && self.renderNav(e.data.tree);
				// render directory and add events handlers
				// self.renderCdc(e.data.cdc);
			}
		})
		;


		// register shortcuts
		$.each(shortcuts, function(i, s) {
			fm.shortcut(s);
		});

		// init tree plugin
		// this.tree.elfindertree(fm);


		/**
		 * Set required files selected, update selected cache
		 * Argument may be
		 * - String: "all" - select all, "none" - unselect all
		 * - Array:  files ids to select
		 * - other:  update selected cache
		 *
		 * @param String|Array|void  - what to select
		 * @return elFinder.view
		 */
		this.select = function(keys) {
			var list = fm._view == 'list',
				cwd = this.cwd,
				i, f;
			
			function select(o) {
				o.each(function() {
					var $this = $(this);
					
					fm.selected.push(fm.get(this.id));
					(list ? $this.children('td') : $this).addClass(hclass);
					$this.draggable(draggableCwd);
				})
			}
			
			function unselect(o) {
				self.fm.selected = [];
				o.draggable('destroy');
				(list ? o.children('td') : o).removeClass(hclass);
			}
			
			if (keys == 'all') {
				select(cwd.find('[id]:not(.'+sclass+')').addClass(sclass));
			} else {
				unselect(cwd.find('[id]:not(.'+sclass+')').removeClass(sclass));
				
				if (keys && keys.length) {
					for (i = 0; i < keys.length; i++) {
						f = cwd.find('#'+keys[i]);
						f.length && select(f.addClass(sclass));
					}
				} else if (keys != 'none') {
					select(cwd.find('[id].'+sclass+''));
				}
			}
			
			fm.trigger('select');
			return this;
		}
		
		
		/**
		 * Render current directory
		 *
		 * @param Array  directory content
		 * @return elFinder.view
		 */
		this.renderCdc = function(cdc) {
			var l    = this.fm.viewType() == 'list',
				c    = 'ui-widget-header',
				oc   = 'directory-opened',
				html = l ? '<table><thead><tr><td class="'+c+'">'+fm.i18n('Name')+'</td><td class="'+c+'">'+fm.i18n('Permissions')+'</td><td class="'+c+'">'+fm.i18n('Modified')+'</td><td class="'+c+'">'+fm.i18n('Size')+'</td><td class="'+c+'">'+fm.i18n('Kind')+'</td></tr></thead><tbody>' : '',
				r    = l ? 'rowHtml' : 'iconHtml';
			
			$.each(cdc, function(k, o) {
				html += self[r](o);
			});
			
			this.cwd.removeClass('elfinder-cwd-' + (l ? 'icons' : 'list')).addClass('elfinder-cwd-' + (l ? 'list' : 'icons')).html(html + (l ? '</tbody></table>' : ''));
			
			l && this.cwd.children('table').find('tr:odd').children().addClass('elfinder-odd-row');
			
			fm.time('cwd')
			this.cwd[l ? 'children' : 'find']('[id]')
				.click(function(e) {
					var t = $(e.currentTarget);
					fm.log(t[0])
					if (t.hasClass('ui-selected') && (e.ctrlKey || e.metaKey)) {
						e.stopImmediatePropagation()
						e.preventDefault();
						t.removeClass('ui-selected');
						self.select();
					}
				})
				.filter('.directory:not(.elfinder-na,.elfinder-ro)')
				.droppable({
					tolerance : 'pointer',
					over : function(e, ui) {
						$(e.target).addClass(oc);
					},
					out : function(e) {
						$(e.target).removeClass(oc);
					},
					drop : function(e, ui) {
						$(e.target).removeClass(oc);
						drop(e, ui, $(e.target).attr('id'));
					}
				})
			fm.timeEnd('cwd')
			
			return this;
		}

		/**
		 * Return file html for icons view
		 *
		 * @param Object  file data
		 * @return String
		 */
		this.iconHtml = function(o) {
			var style = o.tmb ? ' style="background:url(\''+o.tmb+'\') 0 0 no-repeat"' : '',
				p = perms(o),
				c = this.mime2class(o.mime)
			;

			return '<div id="'+o.hash+'" class="ui-corner-all elfinder-file '+p.cssclass+' '+c+'">'
					+ '<span class="ui-corner-all elfinder-cwd-icon"'+style+'/>'
					+ '<span class="elfinder-filename">'+o.name+'</span>'
					+ p.element
					+ symlink(o)
					+ '</div>';
		}
		
		/**
		 * Return file html for list view
		 *
		 * @param Object  file data
		 * @return String
		 */
		this.rowHtml = function(o) {
			var p = perms(o);
			return '<tr id="'+o.hash+'" class="elfinder-file '+p.cssclass+' '+this.mime2class(o.mime)+'">'
					+ '<td class="ui-widget-content"><div><span class="elfinder-cwd-icon"/>'+p.element + symlink(o) + '<span class="elfinder-filename">'+o.name+'</span></div></td>'
					+ '<td class="ui-widget-content">'+this.formatPermissions(o.read, o.write, o.rm)+'</td>'
					+ '<td class="ui-widget-content">'+this.formatDate(o.date)+'</td>'
					+ '<td class="ui-widget-content">'+this.mime2kind(o.mime)+'</td>'
					+ '<td class="ui-widget-content">'+this.formatSize(o.size)+'</td>'
					+ '</tr>';
		}

		/**
		 * Add thumbnails for icons view
		 * 
		 * @param  Object  thumbnails
		 * @return void
		 */
		this.tmb = function(tmb) {
			$.each(tmb, function(id, t) {
				self.cwd.find('#'+id).children('.elfinder-cwd-icon').css('background', 'url("'+t+'") center center no-repeat');
			});
		}

		/*
		 * Convert mimetype into css class
		*/
		this.mime2class = function(mime, prefix) {
			// fm.log(mime+' elfinder-'+mime.replace('/' , ' elfinder-').replace(/\./g, '-'))
			return 'elfinder-cwd-icon-'+mime.replace('/' , ' elfinder-cwd-icon-').replace(/\./g, '-');
		}

		/*
		 * Return kind of file
		*/
		this.mime2kind = function(mime) {
			return this.fm.i18n(this.kinds[mime]||'unknown');
		}
		
		/*
		 * Return localized date
		*/
		this.formatDate = function(d) {
			return d.replace(/([a-z]+)\s/i, function(a1, a2) { return self.fm.i18n(a2)+' '; });
		}

		/*
		 * Return localized string with file permissions
		*/
		this.formatPermissions = function(f) {
			var r = !!f.read,
				w = !!f.read,
				rm = !!f.rm,
				p = [];
			r  && p.push(self.fm.i18n('read'));
			w  && p.push(self.fm.i18n('write'));
			rm && p.push(self.fm.i18n('remove'));
			return p.join('/');
		}

		this.perms2class = function(o) {
			var c = '';
			
			if (!o.read && !o.write) {
				c = 'elfinder-na';
			} else if (!o.read) {
				c = 'elfinder-wo';
			} else if (!o.write) {
				c = 'elfinder-ro';
			}
			return c;
		}

		/*
		 * Return formated file size
		*/
		this.formatSize = function(s) {
			var n = 1, u = 'bytes';
			if (s > 1073741824) {
				n = 1073741824;
				u = 'Gb';
			} else if (s > 1048576) {
	            n = 1048576;
	            u = 'Mb';
	        } else if (s > 1024) {
	            n = 1024;
	            u = 'Kb';
	        }
	        return Math.round(s/n)+' '+u;
		}

	}
	
})(jQuery);