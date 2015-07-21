clickBtnSim = null;// callback da mensagem de confirmação
android     = false;
var request = getXmlHttp();
scrolling	= false; // scrolling control

function f_GetVersao(){
	return '1.2';
}
function f_GetTituloAPP(){
	return "AppDemo";
}
function f_GetBuild(){
	return "18:12 20/07/2015";	
}

function f_SetHeader(visivel){
   $.ui.toggleHeaderMenu(visivel);
   setTimeout(function(){$.ui.toggleHeaderMenu(visivel)}, 1);
}
// retorna o status do servidor 
function f_GetServidorOnline(callback){
	var tmp = getXmlHttp();
	tmp.open("POST", f_GetURL()+"status_servidor.php", true);
	tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	tmp.send();
	tmp.onreadystatechange = retorno;
	function retorno(){
		if(tmp.readyState == 4){
			if (tmp.status==200){	
				if (tmp.responseText!=''){ 
					var obj = JSON.parse(tmp.responseText)[0];
					callback(obj.status);
				}
			}else{
				callback(-1);
			}
		}
	}			
}

function f_ResizeWindow(){
	f_ResizeMensagem();
	var hei = $(window).height();
	var wid = $(window).width();

	$('#tbLogin')[0].style.height = (hei-11)+"px";
	
	$('#tabCreditos')[0].style.height = (hei-130)+"px";
	$('#btnVis')[0].style.left = (wid-$('#btnVis')[0].getBoundingClientRect().width-10)+"px";
	$('#black')[0].style.height = (hei)+"px";
	$('#tbImg')[0].style.height = (hei)+"px";
	$('#tbImg')[0].style.top	= '0px'; 
	$('#black')[0].style.top	= '0px'; 
	
	$('#imgVis')[0].style.setProperty('max-height',  (hei)+"px");
	
}
function f_CarregarDados(){
	// carrega o ultimo email logado
    f_GetConfig("ultimoEmail", 
      function(email){
  	    document.getElementById("email").value = email;
		// busca na base online os dados do último usuário logado
		f_RecuperarUsuario(email, function(a){});
    });
	
}

// remove os dados visuais para entrada de um novo usuário
function f_ResetarComponentes(){
    document.getElementById("msgNenhuma").style.visibility = 'visible';
	maiorIdMsg = 0;
	
	// exclui as mensagens
	f_ExcluirLinhas('tblMensagens');
}
function f_LimparHistorico(){
  $.ui.clearHistory();	
}
function f_ValidarEmail(email){
	// remove o último ponto e virgula, se tiver 
	if (email.charAt(email.length-1)==';'){
		email = email.substr(0, email.length-1);
	}
	// não permitirá email com caracteres especiais
	especiais = "'%$#*,:<>/\?|!&()=[]{}^~"+'"'.split('');
	for (k=0; k<especiais.length;k++){
		if (email.indexOf(especiais[k])>=0){
			return false;
		}
	}
	lista = email.split(';');
	for (k=0; k<lista.length;k++){
		if (!(lista[k].indexOf("@")>0&lista[k].lastIndexOf(".")>lista[k].indexOf("@")+2&lista[k].lastIndexOf(".")<lista[k].length-2)){
			return false;
		}
	}
	return true;
}

function f_OnDeviceReady() {
	document.addEventListener("backbutton", f_OnBackButton, false);
	document.addEventListener('hidekeyboard', f_OnKeyboardHide, false);
    document.addEventListener('showkeyboard', f_OnKeyboardShow, false);
	try {
		// define a cor e mostra o statusbar 
		StatusBar.styleLightContent();
		StatusBar.overlaysWebView(true);
		StatusBar.show();
	}
	catch(err) {
	}
}

function f_Iniciar(){
    
    document.addEventListener('deviceready', f_OnDeviceReady, false);
	document.title=f_GetTituloAPP();
	$.ui.autoLaunch = false; 
    $.ui.animateHeaders = false;
	f_DefinirTema();
	
	$(document).ready(function(){
	    $.ui.launch();
		// inicializa o banco
		f_OnInit(function(a){			
			if (f_GetIOS7()){
			    $("#afui").get(0).className='ios7';
				$.ui.header.style.setProperty('height', '55px');
				$.ui.header.style.setProperty('padding-top', '15px');
				document.getElementById('lista').style.setProperty('padding-top','18px');
				
				$(window).trigger('resize');
			}
			// seta a versão na tela de login(Somente em desenvolvimento)
			//document.getElementById("strVersao").innerHTML = "Build: "+f_GetBuild();
			f_CarregarDados();
			f_ValidarEntrada();
			f_RecuperarImagem();// recupera a imagem do sobre
		});	
	});

	//setTimeout(function(){$.ui.toggleNavMenu(false);},10);	
}

function f_KeyLogin(key){
 
}

function f_GetURL(){
	return "http://www.appipoka.com/appdemo/";
} 

function f_SetMsg(msg, tempo){
    var tmr = null;
	// seta para todos os campos de mensagem
    div = document.getElementsByClassName('msg');
	for (i=0; i<div.length; i++){
		div[i].innerHTML="<p style='text-align:center;'>"+msg+"</p>";
	}
	if (tempo>0){
		tmr = setTimeout(f_OcultaMsg, tempo*1000);
	}
}

function f_OcultaMsg(){
	// seta para todos os campos de mensagem
    div = document.getElementsByClassName('msg');
	for (i=0; i<div.length; i++){
		div[i].innerHTML="";
	}
	document.getElementsByName("msgPergunta")[0].style.visibility='hidden';
}

function f_SetMsgCarregando(msg){
    document.getElementById("msgCarregando").innerHTML="<h1>"+msg+"</h1>";
	if (msg!=""){
		document.getElementById("afui_mask").style.visibility = "visible";
		f_OcultaMsg(); // oculta  a mensagem da tela
	}else{
		document.getElementById("afui_mask").style.visibility = "hidden";
	}
}

// quando clicar no sim na mensagem de pergunta
function f_MsgPerguntaSim(){
    f_OcultaMsg();
    clickBtnSim();	
}
function f_SetMsgPergunta(msg, callbackSim){
	document.getElementById("msgPergunta").innerHTML="<h1>"+msg+"</h1>";
    document.getElementsByName("msgPergunta")[0].style.visibility = "visible";	
	clickBtnSim = callbackSim;
}


function f_GetValor(id){
	return document.getElementById(id).value.trim();
}

function f_AbrirLogin(){
	
    // oculta os componentes desnecessários
	f_SetBarraNavegacao(false);

	// desabilita os menus
	$.ui.menu.style.visibility = "hidden"; 
	document.getElementById("lista").style.visibility = "hidden";
	$.ui.setSideMenuWidth('0px');
    f_SetMsgCarregando("");
	document.getElementById("senha").value = "";
	$.ui.loadContent("pgLogin", null, null, "none");
    document.getElementById("afui").style.opacity = "255";
	f_LimparHistorico();
	f_SetHeader(false);
}

function f_GetMenu(tipo){
	env = '';
	if (tipo=='1'){
		env = '<li><a href="#pgEnvio" class="icon upload" id="btnEnvioMsg" onclick="f_MudancaTela();f_LimparHistorico();">Enviar Mensagem</a></li>';
	}
	return '<li><a href="#pgMensagens" class="icon chat" id="Mensagens" onclick="f_MudancaTela();f_LimparHistorico();">Mensagens</a></li>'+ env + 
			'<li><a href="#pgMural" class="icon paper" id="mural" onclick="f_MudancaTela();f_LimparHistorico();">Cardápio</a></li>'+
			'<li><a href="#pgAltSenha" class="icon key" id="inicio" onclick="f_MudancaTela();">Alterar senha</a></li>'+
			'<li><a href="#pgContato" class="icon mail" id="sobre" onclick="f_MudancaTela();">Contato</a></li>'+
			'<li><a href="#pgSobre" class="icon info" id="sobre" onclick="f_MudancaTela();">Créditos</a></li>'+
			'<li><a href="#" class="icon close" id="inicio" onclick="f_MudancaTela();f_Desconectar();">Desconectar</a></li>'+
			'<div style="text-align:center;width:100%; margin-top:10px; color:#FFF; opacity:0.5">Versão '+f_GetVersao()+'</div>';
}
// Função chamada depois do login
function f_AbrirInicio(){
	f_SetHeader(true);
	f_InitPush(f_NovaMensagemPush); // necessário para as notificações push. f_NovaMensagemPush(e) está em mensagem.js
    f_SetMsgCarregando("");
	f_ResetarComponentes();
	// habilita os menus
	$.ui.menu.style.visibility = "visible"; 
	$.ui.setSideMenuWidth('260px');
	document.getElementById("lista").style.visibility = "visible";
	f_SetBarraNavegacao(true);

	$.ui.loadContent("pgMensagens", null, null, "slide");
		
	document.getElementById("afui").style.opacity = "255";
   
	f_LimparHistorico();
	
	f_CarregarMural(f_TimerMural); 
	
	// recupera as mensagens locais
	f_RecuperarMensagensLocais(
	  function(a){
		// faz as sincronizações em background
		f_RecuperarMensagens(function(a){});
	  });
	  
	// sincronizar as respostas não enviadas
	//f_EnviarRespostasServidor(function(f){});
	
	
	// recupera as informações de contato e mostra na tela
	f_CarregarInformacoes();
	f_GetInformacoesContato();
	
	// sincroniza as mensagens com flagsincronizado = 'F'
	f_EnviarStatusMsgServidor(function(f){});
	
	// inicia a sincronização de mensagens excluidas	
	f_InicarTimerExclusao();
	
	// monta o menu lateral 
	document.getElementById('lista').innerHTML = f_GetMenu(tipoUsuario);
}

// função de validação genérica
//    condicao = [[Campo,        Expressão(opcional),     Mensagem de validação], [Campo, ...], ...]
function f_Validacao(condicoes){
	for (i=0; i<condicoes.length; i++){
		// verifica a expressão ou verifica se o campo está em branco, caso seja uma validação simples
		if ((condicoes[i][1]!=''&eval(condicoes[i][1]))||(condicoes[i][1]==''&f_GetValor(condicoes[i][0])=='')) {
			// destaca o campo
			document.getElementById(condicoes[i][0]).style.borderColor='#F00';
			// apresenta a mensagem de validação
			f_SetMsg(condicoes[i][2]);
			return false;
		}
  }
  return true;
}
// volta a cor original do campo(antes do erro de validação)
function f_ResetCor(campo){
	campo.style.borderColor='#CCC';
}
// limpa os campos passados por array
function f_LimparCampos(campos){
	for (i=0; i<campos.length; i++){
		document.getElementById(campos[i]).value="";
		f_ResetCor(document.getElementById(campos[i]));
    }
}
// exclui todas as linhas de uma tabela
function f_ExcluirLinhas(idTabela){
	// remove as linhas da tabela
	var tabela	= document.getElementById(idTabela);
	while (tabela.rows.length>0){
		tabela.deleteRow(0);
	}
	
	return tabela;
}

function f_AbrirSite(url){
	cordova.exec(null, null, "InAppBrowser", "open", [url, "_system"]);
}

// seta o caption a imagem e a ação do botão de mensagens de acordo com a tela que se encontra
function f_SetBotaoMensagens(visualizacao){// visualização de mensagem
	
}

function f_OnBackButton(){ 
	if (blackWindow){
		f_EsconderTelaPreta();
		return;
	}
	// cancela a seleção(se estiver)
	if ($.ui.activeDiv.id=='pgMensagens'&&menuMsgs){
		f_LimparSelecao();
		return;
	}
	if ($.ui.activeDiv.id=='pgCadastro'){
		f_SetHeader(false); 
	}
	
	f_MudancaTela();
	// irá fechar o aplicativo
	if ($.ui.activeDiv.id=='pgMensagens'||$.ui.activeDiv.id=='pgLogin'){
		navigator.app.exitApp();
	}else{
		history.back();
	}
}

// função chamada sempre que a tela é alterada
function f_MudancaTela(){
	f_SetBotaoMensagens(false);
	// apaga a mensagem
	f_SetMsg('',0);
}

function f_SetBarraNavegacao(visivel){
	document.getElementById("navbar").style.visibility = "hidden";
	document.getElementById("navbar").style.width      = "0";
	document.getElementById("navbar").style.height     = "0";	
}
// funções chamadas quando o teclado aparecer ou for oculto 
function f_OnKeyboardHide(){
/*  	if ($.ui.activeDiv.id!='pgLogin'&&$.ui.activeDiv.id!='pgCadastro'){
		f_SetBarraNavegacao(true);
	}
*/
}
function f_OnKeyboardShow(){
/*
	f_SetBarraNavegacao(false);
*/
}

function f_StrBotaoMenu(){
	styleios7 = "";
	if (f_GetIOS7()){
		styleios7 = "padding-top:15px !important";// a barra de status sobrepõe o header no ios7
	}
	return "<a id='menubadge' onclick='$.ui.toggleSideMenu()' class='menuButton' style='float:left !important;"+styleios7+"'></a>";
}
function f_BotaoMenu(){
	document.write(f_StrBotaoMenu());
}

function f_BotaoVoltar(caption, onclick){
	// Irá colocar o caption para IOs
	if (!f_GetAndroid()&&caption==''){
		caption = "Voltar";
	}
	styleios7 = "";
	if (f_GetIOS7()){
		styleios7 = "padding-top:15px !important";// a barra de status sobrepõe o header no ios7
	}
	document.write("<a id='backButton' class='button' style='visibility: visible; "+styleios7+"' onclick='"+onclick+"'>"+caption+"</a>")
}

function f_Slider(){
	$.ui.ready(function () {
	myScroller = $("#pgMensagens").scroller(); //Fetch the scroller from cache
	myScroller.addInfinite();
	myScroller.addPullToRefresh();
	myScroller.runCB=true;
	$.bind(myScroller, 'scrollend', function () {
		console.log("scroll end");
		scrolling = false;
	});

	$.bind(myScroller, 'scrollstart', function () {
		console.log("scroll start");
		scrolling = true;
		if (processando){
			document.getElementById('imgSincronizando').style.visibility="hidden";
		}
	});
	$.bind(myScroller,"scroll",function(position){
		
	})
	$.bind(myScroller, "refresh-trigger", function () {
		console.log("Refresh trigger");
	});
	$.bind(myScroller, "refresh-release", function () {
		var that = this;
		console.log("Refresh release");
	
		f_RecuperarMensagens(function(a){
		    a = setTimeout(function(){
					that.hideRefresh();
				}, 400);
		});
		
		return false; //tells it to not auto-cancel the refresh
	});

	$.bind(myScroller, "refresh-cancel", function () {
		console.log("cancelled");
	});
	myScroller.enable();

	$.bind(myScroller, "infinite-scroll", function () {
		var self = this;
		console.log("infinite triggered");
		
		$.bind(myScroller, "infinite-scroll-end", function () {
			$.unbind(myScroller, "infinite-scroll-end");
			self.scrollToBottom();
			setTimeout(function () {
				$(self.el).find("#infinite").remove();
				self.clearInfinite();
				
				self.scrollToBottom();
			}, 3000);
		});
	});
	$("#webslider").css("overflow", "hidden"); 
	});

}

// função que decrementa a opacity de um objeto até ficar transparente
function f_EsconderComponente(id, callback){
    if (typeof id !='object'){
		id = [id];
	}
	id.forEach(function(i){
		document.getElementById(i).style.setProperty('opacity', 1);
	});
	
	var tmr = setInterval(function(){
		id.forEach(function(i){
			op = document.getElementById(i).style.getPropertyValue('opacity');
			op = op - 0.05;
			document.getElementById(i).style.setProperty('opacity', op);
			if (op<=0){
				clearInterval(tmr);
				callback(i);
			}
		});
	}, 1);	
}

var blackWindow = false;
// bloqueia o ui e mostra ima imagem de fundo preta
function f_TelaPreta(callback_voltar){
	blackWindow = true;
	
	with(document.getElementById('black')){
		style.visibility = 'visible';
		onclick = callback_voltar;
	}
	document.getElementById('btnVis').onclick = callback_voltar;
	try {
		StatusBar.hide();
	}
	catch(err) {
	}
	f_ResizeWindow();
}

function f_EsconderTelaPreta(){
	blackWindow = true;

	with(document.getElementById('black')){
		style.visibility = 'hidden';
	}
	try {
		StatusBar.show();
	}
	catch(err) {
	}
}