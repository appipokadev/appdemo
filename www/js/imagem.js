//------------------------------------------------------------------
//  CHAMAR A CAMERA DO CELULAR
//------------------------------------------------------------------

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

    takePicture: function() {
      navigator.camera.getPicture( function( imageURI ) {
        setImg("data:image/jpeg;base64," +imageURI);
      },
      function( message ) {
        
      },
      {
        quality: 30,  
        destinationType: Camera.DestinationType.DATA_URL,
		encodingType: Camera.EncodingType.JPEG
      });
    },
    choosePicture: function() {
      navigator.camera.getPicture( function( imageURI ) {
        setImg("data:image/jpeg;base64," +imageURI);
      },
      function( message ) {
        
      },
      {
        quality: 30, 
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
		encodingType: Camera.EncodingType.JPEG
      });
    }
};

function setImg(url){
	// alert(url);
	document.getElementById("imgMsg").src=url;
	document.getElementById("imgMsg").style.visibility = "visible";
	
	urlImg  = url;
	encoded = false;
	f_ResizeWindow();
}
function limparImg(){
	document.getElementById("imgMsg").style.visibility = "hidden";
	base64Img = "";
	f_ResizeWindow();
}

function definirImg(){
	getBase64Img();
	history.back();
}
//-------------------------------------------------------------------------------------- 
// CONVERSÃO DE IMAGEM PARA GRAVAR EM BANCO
//--------------------------------------------------------------------------------------
function encodeImage(src, callback) {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        img = new Image();
		img.crossorigin="anonymous";
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        callback(canvas.toDataURL());
    }
    img.src = src;
}

function getBase64Img(){
	return encodeImage(urlImg, function(encodedImage) { 
		base64Img = encodedImage;
		return encodedImage;
	});
}