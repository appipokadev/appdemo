// carrega as informações de contato da base local e mostra na tela
function f_CarregarInformacoes(){
	f_Select("SELECT nome,valor FROM informacoes",[],
	  function(results){
	    if (results.rows.length>0){
			var a;
			for (a=0; a<results.rows.length; a++){
				var row  = results.rows.item(a);
				tipo = row["nome"];
				dado = row["valor"];
				
				// atualiza o campo específico 
				if (tipo=='facebook'){
					document.getElementById('inf_fb').onclick =eval("(function(){f_AbrirSite('"+dado+"')})");
				}
				
				if (tipo=='telefone'){
					with (document.getElementById('inf_tel')){
						onclick = eval("(function(){   window.open('tel:"+dado+"', '_system')  })");
						innerHTML	= "Ligue para nós <strong>"+dado+"</strong>";
					}
				}
				
				if (tipo=='endereco'){
					with (document.getElementById('inf_end')){
						innerHTML	= "Venha nos visitar <strong>"+dado+"</strong>";
					}
				}
				
				if (tipo=='mapa'){
					with (document.getElementById('inf_end')){
						onclick = eval("(function(){   window.open('http://maps.apple.com/maps?q="+dado+"', '_system')  })");
					}
				}
			}
		}else{
			f_GetInformacoesContato();
		}
	  });
}

// irá solicitar para o servidor as informações de contato
function f_GetInformacoesContato(){
	var tmp = getXmlHttp();
	tmp.open("POST", f_GetURL()+"informacoes.php", true);
	tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	tmp.send();
	tmp.onreadystatechange = retorno;
	function retorno(){
		if(tmp.readyState == 4){
			if (tmp.status==200){	
				if (tmp.responseText!=''){ 
					var obj = JSON.parse(tmp.responseText);
					// atualiza os registros na tabela
					f_AtualizarRegistros('informacoes', obj, f_CarregarInformacoes);
				}
			}else{
				setTimeout(f_GetInformacoesContato, 1000);
			}
		}
	}			
}