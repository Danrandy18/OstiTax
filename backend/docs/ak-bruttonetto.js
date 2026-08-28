$( document ).ready(function() {
    $('.form-control').on('focus blur', function (e) {
		$(this).parents('.form-group').toggleClass('focused', (e.type === 'focus' || this.value.length > 0));
	}).trigger('blur');
	setBruttoNettoRadioActions('');
	setBruttoNettoMehrKinderAction('');

	$("input[type='text']").click(function () {
	   $(this).select();
	});
	$('#BnRechnerSelectArbeitsverhaeltnis').focus();
	setInputFields();
});

function getNum(str) {

  if (str.length == 0) return (0);
  var checkOK = "0123456789-,.";
  var checkStr = str;
  var allValid = true;
  var decPoints = 0;
  var allNum = "";
  for (i = 0;  i < checkStr.length;  i++)
  {
    ch = checkStr.charAt(i);
    for (j = 0;  j < checkOK.length;  j++)
        if (ch == checkOK.charAt(j))
           break;
          if (j == checkOK.length)
        {
            allValid = false;
            break;
        }
        if (ch == ",")
        {
            allNum += ".";
            decPoints++;
        }
        else if (ch != ".")
            allNum += ch;
    }
    if (!allValid)
        return (0);
    if (decPoints > 1)
        return (0);
    var chkVal = allNum;

    return (parseFloat(allNum));
}
function convert(num) {

  var neustr = "";
  var str = String(num); //95
  if (str.indexOf(".") != -1) {
    euros = str.split(".")[0];
    cents = str.split(".")[1];
  }
  else {
    euros = str;
    cents = "00";
  }
  if (cents.length > 2) {
    cents = String(Math.round (parseFloat("0."+cents) * 100)).substring(0,2);
  }
  else if (cents.length == 1)
    cents = cents * 10;
  if (cents.length == 0)
    cents = "00";
  else if (cents.length == 1)
    cents = "0" + cents;
    i = euros.length
    i -= 3
  while (i > 0) {
    euros = euros.substring(0, i) + "." + euros.substring(i);
    i -= 3;
  }
  return euros + "," + cents;
}

function setFamilienBonus(elm) {

	var $this = $(elm).closest('form');
	var val = $this.find('#familienBonus').val();
	var val_2 = $this.find('.esraAlleinverdiener:checked').val();

	if(val > 0) {
		$this.find('.esraBnRechnerInputKinderArea').show();
	} else {
		if(val_2 == 0) {
			$this.find('.esraBnRechnerInputKinderArea').hide();
		}
	}

}

function setBruttoNettoRadioActions(ele){
	
	$(ele + ' .esraBnRechnerRadio').click(function(){
		changeSelectRadioValue(this);
	});
	$(ele + ' input.einkommenSelect').click(function(){
		setEinkommenPeriod(this);
	});
	$('input.esraAlleinverdiener').click(function() {
		setBnRechnerKinderInputs();
		setBruttoNettoMehrKinderAction();
	});	
}

function changeSelectRadioValue(elm){
	radioValue = $(elm).attr('data-value');
    fieldName = $(elm).attr('data-name');
//	console.log("changeSelectRadioValue");
	selectedElement = $(elm).parent().children('.esraBnRechnerSelected')
	selectedElement.removeClass('esraBnRechnerSelected');
	$(elm).addClass('esraBnRechnerSelected');
	$('#'+fieldName).val(radioValue);
	setInputFields();
}

function leaveRechnerNumField(in_str, komma) {
	in_str=in_str.replace(/ /g,""); 
    in_num=getNum(in_str);
	if (in_num > 0)
		if (komma) return convert(in_num); 
		else return in_num;
	else return "";
}
function setEinkommenPeriod(elm) {
	elmID = $(elm).attr('data-labelID');
	elmText = $(elm).attr('data-labelBrutto');
	$('#'+elmID).html(elmText);
}
function setBnRechnerKinderInputs() {
	var familienBonus = $('#familienBonus').val();
	if ($(".esraAlleinverdiener:checked").val() == 1) $('.esraBnRechnerInputKinderArea').show();
	else {
		if(familienBonus == 0) {
			$('.esraBnRechnerInputKinderArea').hide();
		}
	}
}
function setBruttoNettoMehrKinderAction(elm){
		$(".esraMehrKinder").val("1");
}
function onChangeHiddenField(elm, radioname){

	var radioval = $.trim(elm.value.split("\:").pop());
	var radio = $(".esraBnRechnerRadio[data-name='" + radioname + "'][data-value='" + radioval + "']");

	if(radio.length == 0){
		$(".esraBnRechnerRadio[data-name='" + radioname + "']").parent('.esraBnRechnerSelected').removeClass('esraBnRechnerSelected');
	}
	else changeSelectRadioValue(radio);

	$("#esraBnRechnerBoxSubmit").val(1);
}
function enterRechnerNumField(elm) {
	$('#BnRechnerInputBox .BnRechnerErrorMessage').hide();
}
function bruttoNettoSelfResetSubmit() {
	console.log('form-send ');
	$('#submitActionResult').val('newReset');
	$('#esraBNselfResultForm').submit();
}
function setInputFields() {
	var av = $('#BnRechnerSelectArbeitsverhaeltnis').val();
	console.log('executed');
	if (av == 3) {
		$('#pendler').hide();
		$('#workplace').hide();
		$('#sachbezugGroup').hide();
	} else if (av == 4) {
		$('#pendler').show();
		$('#workplace').hide();
		$('#sachbezugGroup').show();
	} else {
		$('#pendler').show();
		$('#workplace').show();
		$('#sachbezugGroup').show();
	}
}