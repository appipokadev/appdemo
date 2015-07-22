/*
Pré requisitos para utilizar esta JS:
		* Incluir os plugins na config.xml:
			<gap:plugin name="com.phonegap.plugins.pushplugin" version="2.1.1" />
			<gap:plugin name="org.apache.cordova.device" />
			<gap:plugin name="org.apache.cordova.media" version="0.2.8" />
			<gap:plugin name="org.apache.cordova.dialogs" />
			
		* Incluir seguindes arquivos no index.html:
			js/push/PushNotification.js
			js/push/config_push.js
			
		* o arquivo index.js deve ter uma função chamada  f_GetURL() que retorna o url do servidor para Registrar/Desregistrar o device 
		* deve ter uma instância da variável "idpessoa" para vincular corretamente o device 
		* Chamar a função f_InitPush() quando estiver logado já
		* definir as configurações abaixo
*/


// configurações a serem definidas para funcionar o push
var urlPlayStore	= "https://play.google.com/store/apps/details?id=com.appipoka.appdemo";
var urlAppleStore	= "";
var senderID		= "804351814152"; // id do aplicativo no console google
var callBackMsg		= null; // função que será chamada quando receber um push. obs(não setar aqui)
/*
	exemplo:
	f_InitPush(function(e){
		alert(e.payload.message);
		alert(e.payload.XXX);// XXX pode ser uma tag definida ao enviar um push
	});
*/
// fim das configurações

 
var pushNotification;		
function f_InitPush(callbackNovaMensagem) {
	try{
		callBackMsg = callbackNovaMensagem;// seta o callback para quando receber uma nova mensagem
		pushNotification = window.plugins.pushNotification;
		if (device.platform == 'android' || device.platform == 'Android' ||
				device.platform == 'amazon-fireos' ) {
				pushNotification.register(successHandler, errorHandler, {"senderID":senderID,"ecb":"onNotification"});		
		} else {
			pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});	
		} 
	}
	catch (e){
	
	}
}

function f_RegistrarDevice(token){
	var tmp = getXmlHttp();
	tmp.open("POST", f_GetURL()+"push/registrar.php", true);
	tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	tmp.send('idpessoa='+idpessoa+'&token='+encodeURIComponent(token)+'&plataforma='+f_GetPlataforma()+'&versaoapp='+encodeURIComponent(versaoapp));
	tmp.onreadystatechange = retorno;
	function retorno(){
		if(tmp.readyState == 4){
			if (tmp.status==200){	
				if (tmp.responseText!=''){ 
					var obj = JSON.parse(tmp.responseText);
				}
			}else{
				// falha de conexão
			}
		}
	}	
}

// handle APNS notifications for iOS
function onNotificationAPN(e) {
	
	if (callBackMsg!=null){
		callBackMsg(e);
	}
	
	if (e.badge) {
		pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
	}
}

// handle GCM notifications for Android
function onNotification(e) {
	
	switch( e.event )
	{
		case 'registered':
		if ( e.regid.length > 0 )
		{
			f_RegistrarDevice(e.regid);
		}
		break;
		
		case 'message':
			if (e.badge) {
				pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
			}
			if (callBackMsg!=null){
				callBackMsg(e);
			}
		break;
	}
}

function tokenHandler (result) {
	f_RegistrarDevice(result);
}

function successHandler (result) {
	
}

function errorHandler (error) {
	
}


