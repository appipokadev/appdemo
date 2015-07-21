/*
* Sincronizar a tabela mensagem_pessoa, passa por parâmetro o maior idmensagem da tabela mensagem_pessoa local para retornar a partir daqueles
* Inclui os novos registros como flagbaixado = 'F'
* Fazer download das mensagens que estão com flagbaixado = 'F' na base local
* Recuperar as mensagens faltantes
*/
var mID = 0; // maior id de exclusão de mensagens
var msgs = getXmlHttp();
var req = getXmlHttp();

// Variáveis do processo de sincronização
fila            = []; // fila de ids de mensagens a sincronizar
sincronizando   = false;
requestId       = 0; // id da mensagem que foi requisitada
processando		= true;
maiorIdMsg      = 0; // controle do id da última mensagem recebida, para verificação de novas mensagens no servidor

var idMsgVis    = 0; // id da mensagem que está sendo visualizada
var idAlVis     = 0; // id do aluno da mensagem que está sendo visualizada
var esperando   = false; // foi clicado na notificação push e está esperando baixar a mensagem 
var idMsgEsperando  = 0; // o id da mensagem que está esperando baixar
var menuMsgs	= false; // armazena o status do menu de mensagens(no cabeçalho ao selecionar uma ou mais mensagens)
var mostrarCarregando = true; // a primeira vez irá mostrar as mensagens carregando
// Sincroniza a tabela mensagem_pessoa
function f_RecuperarMensagens(callback){
  // verifica se já recuperou o maior id do banco 
  if (maiorIdMsg>0){
	f_GetMsgsServidor(maiorIdMsg, callback);
  }else{
	   // recupera o maior idmensagem local
	   f_Select("SELECT coalesce(max(idmensagem),0) maxId FROM mensagem_pessoa WHERE idpessoa=?",[idpessoa],
		function(results){
			if (results.rows.length>0){
				maiorIdMsg = results.rows.item(0)["maxId"];	
				f_GetMsgsServidor(maiorIdMsg, callback);
			}
		});
   }
}
// recupera o cabeçalho das mensagens a partir de um ID
function f_GetMsgsServidor(maiorId, callback){
    if (mostrarCarregando){
		f_ProcessamentoInicio();
		mostrarCarregando = false;
	}
	var recmsg = getXmlHttp();
	// recupera do servidor
	recmsg.open("POST", f_GetURL()+"mensagem_pessoa_recuperar.php", true);
	recmsg.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	recmsg.send("idpessoa="+idpessoa+"&id="+maiorId);
	recmsg.onreadystatechange = retorno;
	function retorno(){
		if(recmsg.readyState == 4){
			if (recmsg.status==200){		
				if (recmsg.responseText!=''){
					objMsgServer = JSON.parse(recmsg.responseText.trim());
					// completa os outos campos do objeto
					for (i=0; i<objMsgServer.length; i++){
						objMsgServer[i].idpessoa    = idpessoa;
						objMsgServer[i].flagbaixada = 'F'; // irá gravar F marcando para ser baixada posteriormente
					}
					// grava na base local
					f_AtualizarRegistros("mensagem_pessoa", objMsgServer, 
					  function(a){
						f_DownloadMensagens();// Identifica as mensagens na base local que ainda não foram recuperadas do servidor
						callback(true);
					  });
				}
			}else{
				f_ProcessamentoFim();
				callback(false);// falha de conexão
			}
		}
	}
}
// Verifica na base local as mensagens que ainda não foram baixadas
function f_DownloadMensagens(){
	 f_Select("SELECT idmensagem FROM mensagem_pessoa WHERE idpessoa=? AND flagbaixada='F' order by idmensagem desc",[idpessoa],
	function(results){
		if (results.rows.length>0){
			// irá reiniciar o processo de sincronização
			fila     = [];
			// alimenta a fila 
			for (i=0; i<results.rows.length; i++)
				fila.push(results.rows.item(i)["idmensagem"]);
			}
		    
			if (results.rows.length>0){
				// inicia o processamento
				sincronizando   = true;
				f_ProcessamentoInicio();
				f_ProcessarFila();
			}else{
				f_ProcessamentoFim();
				f_ProximaVerificacao();
			}
		});	
}

// Função que recupera do servidor as mensagens da fila
function f_ProcessarFila(){
	if (sincronizando&&fila.length>0){
		req.open("POST", f_GetURL()+"mensagem_recuperar.php", true);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.send(encodeURI("id="+encodeURIComponent(fila.join(',')))+"&idpessoa="+idpessoa);
		req.onreadystatechange = retorno;
		function retorno(){
			if(req.readyState == 4){
				if (req.status==200){	
					if (req.responseText!=''){
						objMsgs = JSON.parse(req.responseText.trim());
						for (j=0; j<objMsgs.length; j++){
							// preenche os campos que não vieram
							/*
							objMsgs[j].flaglido   = 'F';
							objMsgs[j].flagrespondido = 'F';
							*/
							// atualiza o maior ID 
							if (objMsgs[j].idmensagem>maiorIdMsg){
								maiorIdMsg = objMsgs[j].idmensagem;
							}						
						
						}
						
						// grava na base local
						f_AtualizarRegistros("mensagem", objMsgs, 
						  function(a){
							 if (a){
						
								var now = new Date();
								dthora = now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+" "+now.toLocaleTimeString(); 
								idmensagens =[];
								for (j=0; j<objMsgs.length; j++){
									idmensagens[idmensagens.length] = objMsgs[j].idmensagem;		
								}
								// avisa para os controles visuais a chegada da mensagem
								f_RecuperarMsg(idmensagens.join(','));
								/*
								// atualiza na base local o campo flagbaixado
								f_ExecuteSQL("UPDATE mensagem_pessoa SET flagbaixada='T', flagsincronizado='T' WHERE idmensagem in ("+fila.join(',')+")",[],function(a){ });	
									
								// atualiza no servidor que a mensagem foi recebida		
								f_AtualizarStatusMensagem(encodeURIComponent(fila.join(',')),0,['dtrecebido'], [dthora]);
								*/
								// atualiza na base local o campo flagbaixado
								f_ExecuteSQL("UPDATE mensagem_pessoa SET flagbaixada='T', flagsincronizado='T' WHERE idmensagem in ("+idmensagens.join(',')+")",[],function(a){ });	
									
								// atualiza no servidor que a mensagem foi recebida		
								f_AtualizarStatusMensagem(encodeURIComponent(idmensagens.join(',')),0,['dtrecebido'], [dthora]);
								
								fila = [];								
								sincronizando = false;
								// fim da fila de sincronização 
								f_ProcessamentoFim();
								// Passa para a próxima mensagem da fila ou tenta novamente em caso de falha 
								f_ProcessarFila();
							 }
						  });	
					}
				}else{ // falha de conexão
					// o processo continuará automaticamente
					sincronizando = false;
                    f_ProximaVerificacao();					
				}
			}
		}	
	}else{ 
		f_ProximaVerificacao();
	}
}
// Define quando irá executar a verificação de novas mensagens
function f_ProximaVerificacao(){
    if (!sincronizando){
		// inicia a verificação de novas mensagens depois de X segundos (a definir)
		setTimeout("f_RecuperarMensagens(function(a){})", 2*1000);
	}	
}

// auxiliares visuais para saber quando o processamento começou, quando terminou e quando recebeu uma nova mensagem
function f_ProcessamentoInicio(){
    if (!scrolling){
		document.getElementById('imgSincronizando').style.visibility = "visible";
	}
	processando = true;
}
function f_ProcessamentoFim(){
	document.getElementById('imgSincronizando').style.visibility = "hidden";
	processando = false;
}

// retorna o cabeçalho origina das mensagens, com o menu(excluir, ...)
function f_GetCabecalhoMensagensMenu(){
	return "<table style='width:100%;height:"+$.ui.header.getBoundingClientRect().height+"px'><tr><td style='float:left;'><h1 onclick='f_LimparSelecao()' style='position:relative;text-align:center; width:30px' class='vector icon check'></td> <td style='float:right;'><h1 onclick='f_ExcluirSelecionados()' style='position:relative;text-align:left;width:30px' class='vector icon trash'></td></h1><tr><table>";
}
// retorna o cabeçalho origina das mensagens, sem menu(excluir, ...)
function f_GetCabecalhoMensagens(){
	return f_StrBotaoMenu()+"<h1>Mensagens</h1>";
}

// retorna as tr selecionadas
function f_GetSelecionados(){
	rows = document.getElementById('tblMensagens').rows;
	rows.filter = [].filter;
	return rows.filter(function(a){return eval(a.getAttribute('selecionado'))});
}
// exclui as mensagens selecionadas
function f_ExcluirSelecionados(){
	tab = document.getElementById('tblMensagens');
	var i;
    var excluir=[];// array de msgs que devem ser excluídas do grid
	// procura na tela as selecionadas para eliminar
	for (i=0; i<tab.rows.length; i++){
		r = tab.rows[i];
		if (eval(r.getAttribute('selecionado'))){
			// recupera os dados da mensagem para exclusão lógica
			idmsg		= r.getAttribute('idmsg');
			idaluno		= r.getAttribute('idaluno');
			flaglido	= r.getAttribute('flaglido');
			flagrespondido	= r.getAttribute('flagrespondido');
			flagrequerresp	= r.getAttribute('flagrequerresp');
			
			/*
			// faz as validações de exclusão 
			if (flaglido=='F'){
				document.getElementById('aviso'+idmsg+'_'+idaluno).innerHTML='Ler antes de excluir!';
				f_SelecionarMensagem(idmsg,idaluno);
				continue;
			}
			if (flagrequerresp=='T'&&flagrespondido!='T'){
				document.getElementById('aviso'+idmsg+'_'+idaluno).innerHTML='Responder antes de excluir!';
				f_SelecionarMensagem(idmsg,idaluno);
				continue;
			}
			*/
			// coloca no vetor para ser eliminado da tela 
			excluir[excluir.length]	= [idmsg,idaluno];
		}
	}

	f_Excluir(excluir);
}
function f_Excluir(excluir){
	// seta o flagexcluido da base local 
	where	= excluir.map(function(a){return '(idmensagem='+a[0]+' AND idaluno='+a[1]+')'  }).join(' OR ');
	sql		= "UPDATE mensagem_pessoa SET flagsincronizado='F', flagexcluido='T' WHERE "+where;
	
	f_ExecuteSQL(sql,[],function(result){});
	// exclui as mensagens da tela
	f_ExcluirTela(excluir);

	// Atualiza no servidor 
	f_EnviarStatusMsgServidor(function(a){});

	
	setTimeout(f_VerificarMenuAcoes, 100);
}
// exclui as mensagens da tela
function f_ExcluirTela(excluir){
	tab = document.getElementById('tblMensagens');
	var i;
	for (i=0; i<excluir.length; i++){
	    idC = 'row'+excluir[i][0]+'_'+excluir[i][1];
		
		if (document.getElementById(idC)==null){
			continue
		}
		
		f_EsconderComponente(idC,function(id){
			id = id.split('row').join('').split('_');
			tab = document.getElementById('tblMensagens');
			var j;
			for (j=0; j<tab.rows.length; j++){ 
				r = tab.rows[j];
				if (r.getAttribute('idmsg')==id[0]&&r.getAttribute('idaluno')==id[1]){
					tab.deleteRow(j);
					// mostra a mensagem de nenhuma mensagem
					if (tab.rows.length==0){
						document.getElementById('msgNenhuma').style.visibility = "visible";
					}
					
					break;
				}
			
			}
		});
	}
}
function f_DeletarMsg(idmsg, idaluno){
	f_Excluir([[idmsg, idaluno]]);
}

function f_LimparSelecao(){
	// cancela a seleção 
	selecao = f_GetSelecionados();
	selecao.forEach(function(r){
		r.style.setProperty('background-color', 'rgba(255, 255, 255, 1)'); // cor original
		r.setAttribute('selecionado',false);
	});
	f_VerificarMenuAcoes();
}
// quando uma mensagem é selecionada mostrará o menu de ações (excluir, ...)
function f_VerificarMenuAcoes(){
	selecao = f_GetSelecionados();
	if (selecao.length>0){
		if (!menuMsgs){
			menuMsgs = true;
			f_EsconderComponente('cabecalhoMsgs', function(){
				document.getElementById('cabecalhoMsgs').style.setProperty('opacity','1');
				document.getElementById('cabecalhoMsgs').innerHTML = f_GetCabecalhoMensagensMenu();
			});
		}
	}else{ 
		// volta o cabeçalho original
		menuMsgs = false;
		document.getElementById('cabecalhoMsgs').style.setProperty('opacity','1');
		document.getElementById('cabecalhoMsgs').innerHTML = f_GetCabecalhoMensagens( );
	}
}

// seleciona a mensagem quando for pressionada no grid
function f_SelecionarMensagem(id, idaluno){
	r = document.getElementById('row'+id+'_'+idaluno);
	if (eval(r.getAttribute('selecionado'))){
		r.style.setProperty('background-color', 'rgba(255, 255, 255, 1)'); // cor original 9ED8EC
		r.setAttribute('selecionado',false);
	}else{
		r.style.setProperty('background-color','#9ED8EC'); // cor selecionado
		r.setAttribute('selecionado',true);
	}
	f_VerificarMenuAcoes();
}

function f_GetSintaxeImg(base64){
	return "<div style='width:100%; text-align:center'><img src='"+base64+"' style='max-width:100%; width:auto; height:auto;' onclick='f_VisualizarImagem(this.src)'></div>";
}
// Adiciona a mensagem no grid de mensagens
function f_AddMensagemGrid(id, titulo, flaglido, dtrecebimento, flagrequerresp, flagrespondido, idaluno, corpo_formatado, imgbase64){
	var strImg="";
	if (document.getElementsByName("msg"+id+"_"+idaluno).length==0){
	    document.getElementById("msgNenhuma").style.visibility = 'hidden';
		dtrecebimento = dtrecebimento.split('-').join('/');
		data = new Date(dtrecebimento);     
		data = ("00" + data.getDate()).slice(-2)+"/"+("00" + (data.getMonth()+1)).slice(-2)+"/"+data.getFullYear()+" "+data.toLocaleTimeString();
		data = data.substr(0,16);// remove as informações (PM, AM ...)
		// no formato EN a hora é retornada diferente. Ex: 4:33 e não 04:33(PT)
		if (data[data.length-1]==':'){
			data = data.substr(0, data.length-1);
		}
		tabela = document.getElementById('tblMensagens');
		// acha a posição para mostrar a mensagem 
		for (k=0; k<tabela.rows.length; k++){
			if (Number(id)>Number(tabela.rows[k].getAttribute('idmsg') )){
				break;
			}
		}
		r = tabela.insertRow(k);
		r.setAttribute("id", "row"+id+"_"+idaluno);
		c = r.insertCell(0);
		//r.setAttribute("onclick", "f_VisualizarMensagem("+id+","+idaluno+")");
		
		$("#row"+id+"_"+idaluno).bind("longTap",function(){f_SelecionarMensagem(id,idaluno)});
		$("#row"+id+"_"+idaluno).bind("tap",function(){if (menuMsgs){f_SelecionarMensagem(id,idaluno);}else{ /*f_VisualizarMensagem(id,idaluno)*/}});
		
		r.setAttribute('selecionado',false);
		r.setAttribute("idmsg", id);
		r.setAttribute("idaluno", idaluno);
		r.setAttribute("flaglido", flaglido);
		r.setAttribute("flagrequerresp", flagrequerresp);
		r.setAttribute("flagrespondido", flagrespondido);
		
		// faz o tatamento para o tamanho do titulo 
		/*if (titulo.length>43){
			titulo = titulo.substring(0, 43)+'...';
		}
		*/
		/*if (flaglido=='T'){
			tit = titulo;
		}else{
		*/	tit = "<b style='margin-left:-1px'>"+titulo+"</b>";
		//}
		// aviso caso a mensagem precise de resposta e ainda não foi respondida
		if (flagrequerresp!='F'&&flagrespondido!='T'){
			strImg= "<img id='img"+id+"_"+idaluno+"' style='width:20px; height:20px' src='img/alerta.png'>";
		}
		// adiciona a imagem no corpo
		sImg = '';
		if (imgbase64){
			sImg = f_GetSintaxeImg(imgbase64);
		}
		
		c.innerHTML = 
					"<div style='width: 100%; display: table;>"+
					"    <div style='display: table-row'>"+
					"        <div style='width: 100%; display: table-cell;'>"+
					"			<div style='width: 100%; display: table;'>"+
					"				<div style='display: table-row'>"+
					"					<div style='width: 100%; display: table-cell;'> "+
					"					  <div style='width: 100%; display: table-cell;' valign='center'>"+tit+"</div>"+
					"					</div>"+
					"				</div>"+
					"			</div>"+
					"		</div><div onclick='f_DeletarMsg("+id+","+idaluno+")' style='height:15px; width:20px; text-align:right'><img src='img/delete1.png' ></div></div>"+
					"        <div style='display: table-cell; > " +
					"			<div align='right' valign ='top'>"+
					" 			  <font style='float:left;margin-top:0px' color='#7F7F7F'>"+data+"</font>"+
					"			</div>"+
					"		</div><p style='margin-top:6px'>"+ corpo_formatado+" </p>"+sImg+
					"    </div>";
		c.setAttribute("id", "msg"+id+"_"+idaluno);
		c.setAttribute("name", "msg"+id+"_"+idaluno);	
	}
	
	// verifica se estava esperando a mensagem (push)
	if (esperando&&idMsgEsperando==id){
		// não está mais esperando
		esperando		= false;
		idMsgEsperando	= 0;
		
		// abre a janela de visualizacao
	//	f_VisualizarMensagem(id, idaluno);
	}
	// irá atualizar como lida
	//f_SetMsgLida(id, idaluno);
}

// Recupera e mostra na tela as mensagens locais 
function f_RecuperarMensagensLocais(callback){
   f_Select("SELECT m.img_base64, m.idmensagem, m.titulo, m.corpo_formatado, m.dtinclusao, m.flagrequerresp, mp.flaglido, mp.flagrespondido, mp.idpessoa, mp.idaluno FROM mensagem_pessoa mp, mensagem m WHERE mp.idmensagem = m.idmensagem AND mp.idpessoa = ? AND coalesce(mp.flagexcluido,'F')<>? order by m.idmensagem asc, idaluno asc",[idpessoa,'T'],
	function(results){
		if (results.rows.length>0){
			tabela = f_ExcluirLinhas('tblMensagens');
			for (i=0; i<results.rows.length; i++){
				with (results.rows)
					f_AddMensagemGrid(item(i)["idmensagem"],item(i)["titulo"],item(i)["flaglido"], item(i)["dtinclusao"], item(i)["flagrequerresp"], item(i)["flagrespondido"], item(i)["idaluno"], item(i)["corpo_formatado"], item(i)["img_base64"]);
			}
		}
		callback(true);
	});
}
// Recupera e mostra na tela uma mensagem especifica (acabou de receber)
function f_RecuperarMsg(idmensagem){
   f_Select("SELECT m.img_base64, m.idmensagem, m.titulo, m.corpo_formatado, m.dtinclusao, m.flagrequerresp, mp.flaglido, mp.flagrespondido, mp.idpessoa, mp.idaluno FROM mensagem_pessoa mp, mensagem m WHERE mp.idmensagem = m.idmensagem AND mp.idpessoa = ?  and mp.idmensagem in ("+idmensagem+")",[idpessoa],
	function(results){
		if (results.rows.length>0){
			for (i=0; i<results.rows.length; i++){
				with (results.rows)
					f_AddMensagemGrid(item(i)["idmensagem"], item(i)["titulo"], item(i)["flaglido"], item(i)["dtinclusao"], item(i)["flagrequerresp"], item(i)["flagrespondido"], item(i)["idaluno"], item(i)["corpo_formatado"], item(i)["img_base64"]);
			}
		}
	});
}
// redimensiona os campos
function f_ResizeMensagem(){
	//var tam	= document.getElementById("pgVerMensagem").getBoundingClientRect();
	//altura	= tam.height;
	altura	= $(window).height();
	
	document.getElementById("tblMsg").style.height = (altura - 65)+"px";
	f_ResizeTituloMensagem();
}
function f_ResizeTituloMensagem(){
	return ;
	var fonte = 18, i, x;   
	var tamBotao = 35; 
	// aumenta o tamanho do botão para IOs
	if (!f_GetAndroid()){
		tamBotao = 170;
	}
	var max = $.ui.header.getBoundingClientRect().width - tamBotao;
	var msg = document.getElementById('tituloMsg').innerHTML;
	document.getElementById('tituloMsg').style.width='auto';
	// vai reajustando o tamanho da fonte até caber na tela
    for (i=fonte; i>1; i--){
		document.getElementById('tituloMsg').style.setProperty('font-size', i+'px');
		// irá tentar quebrar o texto em duas linhas
		if (i<=15){
		    vet = msg.split(' ');
			for (x=vet.length-1; x>(vet.length/2); x--){
				vet = msg.split(' ');
				vet[x]="<br>"+vet[x];
                document.getElementById('tituloMsg').innerHTML = vet.join(' ');	
				if (document.getElementById('tituloMsg').getBoundingClientRect().width<=max){
					break;
				}				
			}
		}
		if (document.getElementById('tituloMsg').getBoundingClientRect().width<=max){
			break;
		}
	}	
	// alinhamento vertical no centro
//	document.getElementById('tituloMsg').style.setProperty("padding-top", ($.ui.header.getBoundingClientRect().height - (document.getElementById('tituloMsg').getBoundingClientRect().height/1.1))+'px');
	document.getElementById('tituloMsg').style.width='100%';
}

// abre a aba de visualização de mensagem 
function f_VisualizarMensagem(idmensagem, idaluno){
	   idMsgVis = idmensagem;
	   idAlVis	= idaluno;
	   f_Select("SELECT  titulo, corpo_formatado, m.idmensagem, mp.flaglido, flagrequerresp, mp.flagrespondido FROM mensagem m JOIN mensagem_pessoa mp ON mp.idpessoa=? and mp.idmensagem=m.idmensagem WHERE mp.idmensagem = ?" ,[idpessoa, idmensagem],
		function(results){
			if (results.rows.length>0){
				titulo	 = results.rows.item(0)["titulo"];
				mensagem = results.rows.item(0)["corpo_formatado"];
				/*
				// array de tags, substitui automaticamente na mensagem 
				var tags = [['(aluno)','aluno'], ['(responsavel)','responsavel'], ['(turma)','turma']];
				
				// substitui as tags 
				tags.forEach(function(a,i){
					pos = -1;
					tag = tags[i][0];
					// acha a posição da tag no texto 
					do{
						pos = mensagem.toUpperCase().indexOf(tag.toUpperCase());
						if (pos>=0){
							mensagem = mensagem.substring(0, pos)+results.rows.item(0)[tags[i][1]]+mensagem.substring(pos+tag.length, mensagem.length);
						}
					} while (pos>=0);
				});
				*/
				document.getElementById('tituloMsg').innerHTML	= titulo;
				document.getElementById('corpoMsg').innerHTML	= mensagem;
				document.getElementById('msgResposta').value	= "";
				document.getElementById('msgAvisoResp').style.visibility = 'hidden';
				// Redimensiona o tamanho da fonte do título(caso precise)
				f_ResizeTituloMensagem();
				document.getElementById('msgResp').style.visibility 	= "hidden";
				$.ui.loadContent("pgVerMensagem", null, null, "slide");
				if (results.rows.item(0)["flagrequerresp"]!='F'&&results.rows.item(0)["flagrespondido"]!='T'){
				    document.getElementById('imgBotao').style.width  = '32px';
					document.getElementById('imgBotao').style.height = '32px';
					document.getElementById('imgBotao').src = 'img/reply.png';
	
					document.getElementById('msgResposta').style.visibility = "visible";
					document.getElementById('divResposta').style.visibility = "visible";
					document.getElementById('divResposta').style.height 	= "87px";
					// mostra o campo de responder a mensagem
					f_SetBotaoMensagens(true);
				}else{ 
					document.getElementById('msgResposta').style.visibility = "hidden";	
					document.getElementById('divResposta').style.visibility = "hidden";
					document.getElementById('divResposta').style.height 	= "0px";
					
				}
				
				f_ResizeMensagem();
				
				var html = document.getElementById('msg'+idmensagem+'_'+idaluno).innerHTML;
				// remove o negrito 
				document.getElementById('msg'+idmensagem+'_'+idaluno).innerHTML = html.split('<b>').join('').split('</b>').join('').split('<b class>').join('').split('<b class="">').join('');
				// remove a mensagem(caso tinha)
				document.getElementById('aviso'+idmensagem+'_'+idaluno).innerHTML="";
				// altera os links para chamar uma função externa ao clicar 
				pgMsg = document.getElementById('pgVerMensagem').getElementsByTagName('a');
				pgMsg.forEach = [].forEach;
				pgMsg.forEach(function(a){ a.setAttribute('onclick', "f_AbrirSite('"+a.href+"')"); a.href="#";});
				
				if (results.rows.item(0)["flaglido"]=='F'){
						f_SetMsgLida(idmensagem, idaluno);
				}
			}
		});	
		esperando		= false;
	    idMsgEsperando	= 0;
	
}

// Atualiza a mensagem no banco local e no servidor(caso ainda não tenha feito) 
function f_SetMsgLida(idmensagem, idaluno){
	var now = new Date();
	dthora = now.getFullYear()+'-'+(("00"+(now.getMonth()+1)).slice(-2))+'-'+("00"+now.getDate()).slice(-2)+" "+now.toLocaleTimeString(); 
	
	// atualiza o flag para lido no banco local 
	f_ExecuteSQL("UPDATE mensagem_pessoa SET flaglido='T', dtleitura='"+dthora+"', flagsincronizado='F' WHERE idmensagem=?",[idmensagem],function(a){});
    
	// atualiza no servidor 
	// f_AtualizarStatusMensagem(idmensagem, idaluno,['flaglido', 'dtleitura'], ['T', dthora]);
	f_EnviarStatusMsgServidor(function(a){});
	
	// seta na tela 
	r = document.getElementById('row'+idmensagem+'_'+idaluno);
	r.setAttribute('flaglido', 'T');
	
}

// Atualiza os campos passados por parametro, (flaglido, flagbaixado, dtrecebimento, deleitura)
function f_AtualizarStatusMensagem(idmensagem, idaluno, col, val){// col[] e val[] -> array de colunas e dados a serem atualizados na mensagem_pessoa no servidor
	if (idmensagem==''){
		return
	}
	var tmp = getXmlHttp();
	tmp.open("POST", f_GetURL()+"mensagem_atualizar_status.php", true);
	tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	tmp.send("idpessoa="+idpessoa+"&idmsg="+idmensagem+"&idaluno="+idaluno+"&col="+encodeURIComponent(col.join(','))+"&val="+encodeURIComponent(val.join(',')));
	tmp.onreadystatechange = retorno;
	function retorno(){
		if(tmp.readyState == 4){
			if (tmp.status==200){	
				if (tmp.responseText!=''){
				}
			}else{
				// falha de conexão
			}
		}
	}	
}

// inicia as tentativas de envio das respostas para o servidor
function f_IniciarEnvioRespostas(){
    // programa uma verificação para daqui 5 segundos
	tmrEnvResps = setTimeout("f_EnviarRespostasServidor(function(a){})", 5000);
}


// função responsável por sincronizar as mensagens que ainda não foram enviadas
function f_EnviarRespostasServidor(callback){
	
	// recupera as mensagens na base local que ainda não foram sincronizadas
	f_Select("SELECT * FROM mensagem_resposta WHERE flagsincronizado=?",['F'], 
		function(results){
			if (results.rows.length>0){
				var i, x;
				var rows=[];
				var cols=[];
				var dados=[];
				// prepara os dados
				for (i=0; i<results.rows.length; i++){
				    ss = JSON.stringify(results.rows.item(i));
					row = JSON.parse(ss);
					row.flagsincronizado = 'T';
					row.flaglido 		 = 'F';
					rows[rows.length] = JSON.stringify(row);
				}
				// concatena os dados com Pipe
				var dados = encodeURIComponent(rows.join('|'));
				atualizar = rows; // para quando o resultado voltar do servidor irá atualizar na base local o flag sincronizado
				// tenta enviar para o servidor 
				var tmp = getXmlHttp();
				tmp.open("POST", f_GetURL()+"resposta_incluir.php", true);
				tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				tmp.send("rows="+dados);
				tmp.onreadystatechange = retorno;
				function retorno(){
					if(tmp.readyState == 4){
						if (tmp.status==200){	
							if (tmp.responseText!=''){
								var obj = JSON.parse(tmp.responseText.trim());
								if (obj.status>0){
								    // Atualiza o flag sincronizado na base local 
									var regs = JSON.parse("["+atualizar.join(',')+"]");
									f_AtualizarRegistros('mensagem_resposta', regs, function(f){});
									callback(true);
								}else{ // falha 
									f_ReiniciarEnvioRespostas();
									callback(false);	
								}
							}else{ // falha 
								f_ReiniciarEnvioRespostas();
								callback(false);	
							}
						}else{ // falha de conexão
							f_ReiniciarEnvioRespostas();
							callback(false);
						}
					}
				}
			}else{ // nehuma resposta a sincronizar 				
				callback(false);
			}
		});
}
// em caso de falha irá programar o timer para tentar enviar novamente 
function f_ReiniciarEnvioRespostas(){
	tmrRespostas = setTimeout("f_EnviarRespostasServidor(function(a){})", 2000);
}

function f_EnviarResposta(){
    if (f_ValidarResposta()){
    document.getElementById('imgBotao').style.width  = '16px';
	document.getElementById('imgBotao').style.height = '16px';
	document.getElementById('imgBotao').src = 'img/loading.gif';
	
	var resposta = document.getElementById('msgResposta').value.trim().substr(0,300);
	
	// grava a resposta na base local 
	 f_ExecuteSQL("INSERT INTO mensagem_resposta (idmensagem, idaluno, idpessoa, resposta, flagsincronizado) VALUES (?,?,?,?,?)",
												  [idMsgVis, idAlVis, idpessoa, resposta, 'F'], 
				 function(r){
				    // irá enviar a resposta para o servidor  
                    f_EnviarRespostasServidor(function(retorno){
						// oculta o campo resposta 
						document.getElementById('msgResposta').style.visibility = "hidden";
						document.getElementById('divResposta').style.visibility = "hidden";
						document.getElementById('divResposta').style.height 	= "0px";
						document.getElementById('msgAvisoResp').style.visibility = 'hidden';
						// mensagem de resposta enviada!
						if (retorno){	
							document.getElementById('msgResp').innerHTML="Resposta enviada!";
						} else{ 
							document.getElementById('msgResp').innerHTML="A resposta será enviada assim que possível.";
						}
						document.getElementById('msgResp').style.visibility 	= "visible";
					});  					
				 });
	

	document.getElementById('tabMensagens').className = document.getElementById('tabMensagens').className.split("pressed").join('');
	document.getElementById('msgResposta').value = "";
	// altera na base local que a mensagem foi respondida
	f_SetMsgRespondida(idMsgVis, idAlVis);
	}
}

//
function f_SetMsgRespondida(idmensagem, idaluno){
	// atualiza o flag para lido no banco local 
	f_ExecuteSQL("UPDATE mensagem_pessoa SET flagrespondido='T' WHERE idmensagem=? AND idaluno=?",[idmensagem, idaluno],function(a){});
    document.getElementById('img'+idmensagem+"_"+idaluno).style.visibility = 'hidden';
	document.getElementById('msgResposta').style.visibility = "hidden";
	document.getElementById('msgAvisoResp').style.visibility = 'hidden';
	r = document.getElementById('row'+idmensagem+'_'+idaluno);
	r.setAttribute('flagrespondido', 'T');
    f_SetBotaoMensagens(false);	
}

// inicia as tentativas de sincronização dos dados no servidor (flaglido, flagexcluido, dtleitura)
function f_ReiniciarEnvioStatusMsg(){
    // programa uma verificação para daqui 5 segundos
	tmrEnvResps = setTimeout("f_EnviarStatusMsgServidor(function(a){})", 5000);
}

// função responsável por sincronizar o status das mensagens no servidor (flaglido, flagexcluido, dtleitura)
function f_EnviarStatusMsgServidor(callback){
	
	// recupera as mensagens na base local que ainda não foram sincronizadas
	f_Select("select idmensagem, idpessoa idperfil, flagexcluido excluido, flaglido lido, dtleitura FROM mensagem_pessoa WHERE flagsincronizado=? AND idpessoa=?",['F', idpessoa], 
		function(results){
			if (results.rows.length>0){
				var i, x;
				var rows=[];
				var cols=[];
				var dados=[];
				// prepara os dados
				for (i=0; i<results.rows.length; i++){
				    ss = JSON.stringify(results.rows.item(i));
					row = JSON.parse(ss);
					row.flagsincronizado = 'T';
	
					rows[rows.length] = JSON.stringify(row);
				}
				// concatena os dados com Pipe
				var dados = encodeURIComponent(rows.join('|'));
				dadosAtualizar = rows; // para quando o resultado voltar do servidor irá atualizar na base local o flag sincronizado
				// tenta enviar para o servidor 
				var tmp = getXmlHttp();
				tmp.open("POST", f_GetURL()+"mensagem_atualizar_flags.php", true);
				tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				tmp.send("rows="+dados);
				tmp.onreadystatechange = retorno;
				function retorno(){
					if(tmp.readyState == 4){
						if (tmp.status==200){	
							if (tmp.responseText!=''){
								var obj = JSON.parse(tmp.responseText.trim());
								if (obj.status>0){
								    // Atualiza o flag sincronizado na base local 
									var regs = JSON.parse("["+dadosAtualizar.join(',')+"]");
									f_AtualizarRegistros('mensagem_resposta', regs, function(f){});
									callback(true);
								}else{ // falha 
									f_ReiniciarEnvioStatusMsg();
									callback(false);	
								}
							}else{ // falha 
								f_ReiniciarEnvioStatusMsg();
								callback(false);	
							}
						}else{ // falha de conexão
							f_ReiniciarEnvioStatusMsg();
							callback(false);
						}
					}
				}
			}else{ // nehuma resposta a sincronizar 				
				callback(false);
			}
		});
}

// será disparada quando receber notificação push de nova(s) mensagem(s)
function f_NovaMensagemPush(e){
	// e.foreground = true; o aplicativo estava aberto durante a recepção do push 
	// e.foreground = false; o usuário teve que tocar na notificação para abrir
	if (typeof e.payload.acao!="undefined"){
		// faz o tratamento da ação
		if (e.payload.acao=='atualizacao'){
			if (f_GetPlataforma().toUpperCase()=='ANDROID'){
				f_AbrirSite(urlPlayStore);
			}else{
				f_AbrirSite(urlAppleStore);
			}
		}
	}else{
		if (!eval(e.foreground)){
			if (Number(e.payload.idmsg)>0){
				f_VerificarRecebimentoLeitura(Number(e.payload.idmsg));
			}
		}else{
			navigator.notification.vibrate(500);
		}
	}
	//alert("Msg -> "+e.payload.message+" Foreground ->"+e.foreground+" idmsg-> "+e.payload.idmsg);	
}

// quando o usuário clicar na notificação para ver a mensagem será chamada esta rotina para esperar o download da mensagem e visualizar
function f_VerificarRecebimentoLeitura(idmsg){
	esperando		= true;
	idMsgEsperando	= idmsg;
	// verifica se já está na base 
	f_Select("SELECT count(1) total, max(idaluno) idaluno  FROM mensagem_pessoa WHERE idmensagem=? AND idpessoa=? AND flagbaixada='T' ",[idmsg, idpessoa], 
		function(results){
			if (results.rows.item(0)["total"]>0){
				f_VisualizarMensagem(idmsg, results.rows.item(0)["idaluno"]);
				// não está mais esperando
				esperando		= false;
				idMsgEsperando	= 0;
			}
		});
}

function f_ValidarResposta(){
	if (document.getElementById("msgResposta").value.trim()==''){
		document.getElementById('msgAvisoResp').style.visibility = 'visible';
		return false;
	}else{ 
		document.getElementById('msgAvisoResp').style.visibility = 'hidden';
		return true;
	}
}


// rotinas para sincronizar exclusão de mensagens 
function f_VerificarExclusao(callback){
		mID = mID||0;
		// recupera no servidor as mensagens excluídas depois desta
		var recmsg = getXmlHttp();
		// recupera do servidor
		recmsg.open("POST", f_GetURL()+"mensagem_excluida_recuperar.php", true);
		recmsg.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		recmsg.send("idpessoa="+idpessoa+"&id="+mID);
		recmsg.onreadystatechange = retorno;
		function retorno(){
			if(recmsg.readyState == 4){
				if (recmsg.status==200){		
					if (recmsg.responseText!=''){
						txtRetMsg = recmsg.responseText.trim();
						objMsg = JSON.parse(recmsg.responseText.trim());
						var maiorid = mID;
						var idExcluir = [];
						// Passa por cada mensagem excluindo da tela e da base local
						for (i=0; i<objMsg.length; i++){
							maiorid = (Number(objMsg[i].identrada)>maiorid) ? Number(objMsg[i].identrada):maiorid; // pega o maior id
							// adiciona no array de ids para excluir 
							idExcluir[idExcluir.length] = objMsg[i].idmensagem;
							// exclui da tela 
							f_ExcluirTela([[objMsg[i].idmensagem,0]]);
						}
						if (idExcluir.length>0){
							idExcluir = idExcluir.join(',');
							// exclui da base local 
							f_ExecuteSQL("DELETE FROM mensagem_pessoa WHERE idmensagem in("+idExcluir+")",[], 
								function(a){
										f_ExecuteSQL("DELETE FROM mensagem WHERE idmensagem in("+idExcluir+")",[],
											function(b){
												mID = maiorid
												// grava na base local o maior id
												f_SetConfig('idExclusao', maiorid);
												callback(true);
											}); 
								});		
						}else{
							callback(true);
						}						
					}
				}else{
					callback(false);// falha de conexão
				}
			}
		}

}
function f_GetMensagemExcluida(callback){// recupera as novas mensagens excluídas, maiores que o id da base local
	// pega na tabela de configuração o id da maior mensagem excluida
	if (mID>0){
		f_VerificarExclusao(callback);
	}else{
		f_GetConfig('idExclusao', function(maiorID){
			mID = maiorID;
			f_VerificarExclusao(callback);
		});
	}
}

function f_InicarTimerExclusao(){
	setTimeout(function(a){
				f_GetMensagemExcluida(f_InicarTimerExclusao)
			   }, 2000);
}

// abre a tela de visuação de imagem
function f_VisualizarImagem(src){
	document.getElementById('imgVis').src = src;
	f_TelaPreta(f_EsconderTelaPreta);
}