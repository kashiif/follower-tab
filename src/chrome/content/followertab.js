'use strict';
var copyPureText = {
	cptIds: null,
	contextMenues: null,

	init: function(evt) {
	
		const THUNDERBIRD_ID = '{3550f703-e582-4d05-9a08-453d09bdfdc6}';  
		
		var appInfo = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo);  
		
		if(appInfo.ID == THUNDERBIRD_ID) {
			this.cptIds = ['copypuretext-context-menu', 'copypuretext-compose-context-menu'];
			this.contextMenues = ['mailContext', 'msgComposeContext'];
			// running under Thunderbird
			this.relocateItemAfterCopyMenu('msgComposeContext');
		}
		else {  
			// running under Firefox or SeaMonkey
			// do nothing because the default values are set this way		  
			this.cptIds = ['copypuretext-context-menu'];
			this.contextMenues = ['contentAreaContextMenu'];
			
			this._handleStartup();
		} 
		
		this.addCopyAsTextItem();
	},
	
	_handleStartup: function() {
		var oldVersion = '';
		var currVersion = '2.2.0';
		
		var prefService = copyPureText._getPrefService();

		try {
			oldVersion = prefService.getCharPref('extensions.copypuretext.version');
		}
		catch(e) {}
		
		if (oldVersion != currVersion) {
			prefService.setCharPref('extensions.copypuretext.version', currVersion);
			try {
				setTimeout(copyPureText._welcome,100,currVersion);
			}
			catch(e) {}
		}
	},
	
	_welcome: function(version) {
		try {
			var url = 'http://www.kashiif.com/firefox-extensions/copy-pure-text-updated?v='+version;
			openUILinkIn( url, 'tab');
		} 
		catch(e) {}
	},
	
	addCopyAsTextItem: function()
	{
		// add listener for enabling/disabling 'Copy As text' menu item
		for (var i=0 ; i<copyPureText.contextMenues.length ; i++) {
			var oContext = document.getElementById(copyPureText.contextMenues[i]);
			if(oContext){
				oContext.addEventListener("popupshowing", copyPureText.onPopupShowing, false);
			}
		}
	},

	/*
	ThunderBird, Copy item in messengercompose.xul does not have an id set.
	This function will put the 'Copy As Text' just after the 'Copy' menu item.
	*/
	relocateItemAfterCopyMenu: function(targetElement)	{
		var oContext = document.getElementById(targetElement);

		if(oContext) {

			var cptItem = document.getElementById('copypuretext-thunderbird-msgComposeContext');
			oContext.removeChild(cptItem);
			
			var index = -1;
			
			// traverse all children of target object and find the index of Copy menu-item
			for (var i=0 ; i<oContext.children.length ; i++)
			{
				var mnuItem = oContext.children.item(i)
				// Copy menu-item has attribute command='cmd_copy' set.
				if (mnuItem.hasAttribute('command') && mnuItem.attributes['command'].value == 'cmd_copy')
				{
					index = i;
					break;
				}
			}
			
			if (index > -1 && index < oContext.children.length-1) {
				// insert the 'Copy As Text' menu-item after the 'Copy' menu-item
				oContext.insertBefore(cptItem, oContext.children.item(index+1));
			}
			else {
				oContext.appendChild(cptItem);
			}
			
		}
	},

	_getPrefService: function() {
		var prefService = null;
		try 
		{
			prefService = gPrefService;
		}
		catch(err)
		{
			// gPrefService not available in ThunderBird
			prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");
		}
		return prefService;
	},
	
	perform: function() {
		var prefService = copyPureText._getPrefService();

		// Format
		try{
			// Get String
			var str = this.getSelectedText() + "";
			
			// Trim
			if(prefService.getBoolPref("extensions.copypuretext.trimSpace"))
				str = str.trim();
			
			// Extra Lines
			if(prefService.getBoolPref("extensions.copypuretext.removeEmptyLines"))
				str = str.replace(/[\n\r]+/g, "\n");
			
			// Extra Space
			if(prefService.getBoolPref("extensions.copypuretext.removeExtraSpaces"))
				str = str.replace(/[ \t]+/g, " ");
			
			// Copy to clipboard
			if(str != null && str.length > 0) {
				const clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);  
				clipboardHelper.copyString(str);
			}
		}
		catch(err) { alert("An unknown error occurred\n"+ err); }
	},

	shouldShowMenu: function () {
		// Check if there is some text selected
		try{		
			var str = this.getSelectedText();
			if(str != null && str.length > 0)
			{
				return true;
			}
					
		}catch(err) { }
		
		return false;
	},

	getSelectedText: function () {
		var focusedWindow = document.commandDispatcher.focusedWindow;
		var searchStr 		= focusedWindow.getSelection.call(focusedWindow);
		searchStr 			= searchStr.toString();
		
		return searchStr;
	},

	onPopupShowing: function (evt) {
		var cm = evt.target;

		// traverse all children of target object
		for (var i=0 ; i<cm.children.length ; i++)
		{
			var mItem = cm.children.item(i)
			
			// locate copy-pure-text menu item
			if (mItem.id.indexOf('copypuretext-') == 0)
			{
				// and collapse it
				mItem.collapsed = !copyPureText.shouldShowMenu();
				break;
			}
			
		}
	}

};

window.addEventListener
(
  "load", 
  function (e) { copyPureText.init(e); },
  false
);