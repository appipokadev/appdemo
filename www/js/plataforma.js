function f_GetAndroid(){
	return $.os.android;
}

function f_GetIOS7(){
	return $.os.ios7||$.os.iphone;
}
function f_GetPlataforma(){
	if (typeof device != 'undefined'){
		return device.platform;
	}
}

function f_DefinirTema(){
	/*if (f_GetAndroid()){
		$.ui.useOSThemes=false; // desabilitar os temas especificos do sitema operacional
	}
	else{
		$.ui.useOSThemes=true; // irá usar o tema do iphone
    }
	*/
	$.ui.useOSThemes=false; // desabilitar os temas especificos do sitema operacional
}