(function ($) {

	var DJPIAutocomplete = function(form) {
	   	var _form = $(form),
	    	$selects = _form.find('select');

	    _form.find('input.autocomplete-text').attr('placeholder', 'Search');

	    $selects.each(function() {
	    	$(this).removeClass('chosen-select');

	    	buildSelectUI($(this));
		});

		registerEvents(_form);
	};

	/*
	All the various events.
	*/
	var registerEvents = function(_form) {

		_form.find('input').attr('autocomplete', 'off');

		_form.on('click', '.active-result', function(event) {
			var $currentTarget = $(event.currentTarget);
            optionClick($currentTarget);
        });

        _form.on('click', '.djpi-ac-text-input', function(event) {
			var $currentTarget = $(event.currentTarget);
            addAutoCompleteTextSelection($currentTarget);
        });

        _form.on('click', '.djpi-ac-display', function(event) {
			var $currentTarget = $(event.currentTarget);
            showDropDown($currentTarget);
        });

        _form.on('keyup', '.autocomplete-text', function(event) {
			var $currentTarget = $(event.currentTarget);
            autoComplete($currentTarget);
        });

        _form.on('click', '.djpi-ac-choice-delete', function(event) {
			var $currentTarget = $(event.currentTarget);
            removeMultiSelectItem($currentTarget);
            return false;
        });

        _form.on('click', '#reset_button', function(event) {
			var $currentTarget = $(event.currentTarget);

			resetForm($currentTarget);
            return false;
        });

        _form.on('click', '#search_button', function(event) {
			// Do something
        });

        _form.on('submit', function(event) {
			compileMultiSelectOptions($(this));
        });

        // Closes drop downs
		$(document).bind('click', function() {
			try {
				var $e = $(event.target);

				if ($e.hasClass('autocomplete-text')) {
					return;
				}

				if ($e.hasClass('djpi-ac-input')) {
					return;
				}

				if ($e.hasClass('djpi-ac-display')) {
					return;
				}

				$('.djpi-ac-drop').hide();
			}
			catch(err) {
				// Do something
			}
		});
	};

  	/*
  	Builds the styled drop down and injects data from <select> >> <option>'s
	Echoes any previously selected options from POST or sessions
  	*/
	var buildSelectUI = function($el) {
  		var $select = $el,
			$defaultOption = $select.find('option:selected'),
  			isMultiple = ($select.attr('multiple')) ? true : false,
  			isAutoComplete = ($select.hasClass('autocomplete-text')) ? true : false,
  			styledSelectID = $select.attr('id') + '_styled',
			styledSelectHeight = $select.height(),
			styledSelectWidth = $select.width(),
			dataField = $select.data('field'),
			dataIdLabel = $select.data('id_label'),
			dataModel = $select.data('model'),
			$selectOptions = $select.children('option'),
	    	$container = $('<div>', {id: styledSelectID, class: 'djpi-ac-container'}),
			$display = $('<ul>', {class: 'djpi-ac-display'}),
			$searchFieldLI = $('<li>', {class: 'djpi-ac-search'}),
			$searchField = $('<input>', {type: 'text', name: 'search', class: 'djpi-ac-input', placeholder: 'Select', readonly: 'true'}),
			$choicesDropDown = $('<div>', {class: 'djpi-ac-drop'}),
			$choicesList = $('<ul>', {class: 'djpi-ac-choices-list'});

		// Hides the actual HTML select field
		$select.hide();

		if (!isMultiple) {
			$defaultOption.prop('selected', true);
			$select.val($defaultOption.val());
			$searchField.val($defaultOption.text());
			$searchField.attr('data-object-id', $defaultOption.val());
		}

		// Add ordered list to drop down
		$choicesDropDown.append($choicesList);

		// Take options from select and inject into styled drop down
		$selectOptions.each(function(index) {
			var $choice = $('<li>', {class: 'active-result'});

			$choice.attr('data-option-id-value', $(this).val());
			$choice.text($(this).text());
			$choicesList.append($choice);

			if (isMultiple) {
				//Populate any previously set via POST/session
				//Remove its counterpart from the styled drop down
				$choice.hide();
				$(this).attr('selected', 'selected');
				addMultiSelectItem($choice, $display);
			}
		});

		if (isAutoComplete) {
			/*
			For autocomplete selects, the required AJAX attributes get passed to the <select>
			So we can always access these values from the same element (search field <input>), assign them there
			*/
			$searchField.attr('data-field', dataField);
			$searchField.attr('data-id_label', dataIdLabel);
			$searchField.attr('data-model', dataModel);

			$searchField.attr('readonly', false);
			$searchField.attr('placeholder', 'Search');
			$searchField.addClass('autocomplete-text');
		}

		// Add search input to <li>
		$searchFieldLI.append($searchField);
		// Add <li> created above to display
		$display.append($searchFieldLI);

		// Add display to container
		$container.append($display);
		// Add choices (<option>'s injected into <li>'s)
		$container.append($choicesDropDown);

		if (isMultiple) {
			$container.addClass('djpi-ac-container-multi');
		} else {
			$searchField.height(styledSelectHeight);
			$searchField.width(styledSelectWidth);

			$container.addClass('djpi-ac-container-single');
		}

		// Add completed build after respectice <select>
		$select.after($container);
  	};

  	/*
  	Shows "pretty" drop down on click.
  	$el == ul.djpi-ac-display
  	*/
  	var showDropDown = function($el) {
  		var $container = $el.closest('.djpi-ac-container'),
			$choicesDropDown = $container.find('.djpi-ac-drop'),
			$select = $container.prev('select'),
			$input = $container.find('input');

		closeAllDropDowns();

		$choicesDropDown.show();
		$input.focus();
  	};

  	/*
  	Mimics a traditional <option> click
  	$el == <li>
  	*/
  	var optionClick = function($el) {
  		var id = $el.data('option-id-value'),
			text = $el.text(),
			$container = $el.closest('.djpi-ac-container'),
			$display = $container.find('.djpi-ac-display'),
			$inputField = $display.find('input'),
			$choicesDropDown = $container.find('.djpi-ac-drop'),
			$htmlSelect = $container.prev('select'),
			$originalSelect = $container.prev('select'),
			isMultiple = ($originalSelect.attr('multiple')) ? true : false;

		// Assign the original (hidden) select the value chosen.
		$htmlSelect.val(id);
		$htmlSelect.find('option[value="' + id + '"]').prop('selected', true);
		$htmlSelect.trigger('change');

		$choicesDropDown.hide();

		if (isMultiple) {
			// Remove selection from available options
			$el.hide();
			addMultiSelectItem($el, $display);

			return;
		}

		// For regular selects & autocomplete text inputs, display the selection
		$inputField.attr('data-object-id', $el.data('option-id-value'));
		$originalSelect.find('option[value="' + $el.data('option-id-value') + '"]').prop('selected', true);
		$inputField.val(text);
  	};

  	/*
	$el == li.djpi-ac-text-input
	*/
	var addAutoCompleteTextSelection = function($el) {
		var $choicesDropDown = $el.closest('.djpi-ac-drop');

		$choicesDropDown.prev('input').val($el.text());
		$choicesDropDown.remove();
	};

  	/*
  	Add selected option to the display
  	$el == li.active-result
  	*/
  	var addMultiSelectItem = function($el, $display) {
  		var $inputField = $display.find('input[name="search"]'),
  			id = $el.data('option-id-value'),
			text = $el.text(),
			$item = $('<li>', {class: 'djpi-ac-choice'}).html('<span>' + text + '</span>'),
			$deleteChoice = $('<a>', {href: '#', id: id, class: 'djpi-ac-choice-delete'}).text('X');

		$item.append($deleteChoice);
		$item.prependTo($display);

		// Reset the search field
		$inputField.val('');
		$inputField.width(50);
		$inputField.focus();
	};

  	/*
	$input == input[name="search"]
  	*/
  	var autoComplete = function($input) {
  		var $container = $input.closest('.djpi-ac-container'),
	    	$select = $container.prev('select'),
	    	isMultiple = ($container.hasClass('djpi-ac-container-multi')) ? true : false,
	    	isSingle = ($container.hasClass('djpi-ac-container-single')) ? true : false,
	    	query_string = $input.val(),
          	baseUrl = $input.closest('form.djpi-autocomplete').data('djpi-autocomplete-path'),
          	model = $input.data('model'),
          	field = $input.data('field'),
          	id_label = $input.data('id_label'),
			ajaxUrl = baseUrl + '?model=' + model + '&field=' + field + '&query_string=' + query_string;

		// Threshold before autocomplete queries.
	    if (query_string.length < 3) {
        	return;
      	}

      	if (isMultiple) {
      		/*
	    	Expand the autocomplete input width in connection with entered text.
	    	We want to keep the field as short as possible to work with the added items (inline <li>).
	    	*/
			$input.width(($input.width() + ($input.val().length * 2)));
		} else if (isSingle) {
			$input.width('100%');
		}

	    $.ajax({
            url: ajaxUrl,
            type: 'GET',
            success: function(json) {
            	var data = json.data;

            	if (isMultiple || isSingle) {
					populateMultiSelect(data, field, id_label, $select);
	            	return;
	            }

	            populateTextFieldDropdown(data, field, id_label, $input);
            }
        });
  	};

  	/*
	Injects data from the AJAX return into <option>'s for the select.
  	*/
  	var populateMultiSelect = function(data, field, id_label, $selectField) {
		var $container = $selectField.next('.djpi-ac-container'),
			currentIDs = [];

		$container.find('a').each(function() {
			currentIDs.push(parseInt($(this).attr('id')));
		});

		// Remove all '<option>' so we don't dupe results
		$selectField.empty();
		// Do the same for the 'pretty' drop down
		$container.find('.active-result').remove();

		$.each(data, function(index, element) {
			var $option = $('<option>', {value: element[id_label]}).text(element[field]);

    		// If someone runs another typeahead search we clear previous results.
    		// In which case, check the new return isn't in any currently selected.
    		if ($.inArray(element[id_label], currentIDs) == -1) {
    			$selectField.append($option);
    		}
		});

		populateStyledSelect($selectField, $container);
	};

	/*
	Injects <li> based on the newly built <select> >> <option>'s in populateMultiSelect().
	*/
	var populateStyledSelect = function($selectField, $container) {
		var	$selectOptions = $selectField.children('option'),
			$choicesDropDown = $container.find('.djpi-ac-drop'),
			$choicesList = $choicesDropDown.find('.djpi-ac-choices-list');

		$selectOptions.each(function(index) {
			var $choice = $('<li>', {class: 'active-result'})

			$choice.attr('data-option-id-value', $(this).val());
			$choice.text($(this).text());
			$choicesList.append($choice);
		});

		$choicesDropDown.show();
	};

	/*
	Remove an item from the multi-select display and restore it in the styled select.
	$el == a.djpi-ac-choice-delete
	*/
	var removeMultiSelectItem = function($el) {
		var id = $el.attr('id'),
			$li = $el.parent('li'),
			$restoreLi = $li.parent('ul').next('.djpi-ac-drop').find('li[data-option-id-value="' + id + '"]');

		$li.remove();
		$restoreLi.show();
	};

  	/*
	Injects data from the AJAX return into <li>'s for the "pretty" drop down.
  	*/
  	var populateTextFieldDropdown = function(data, field, id_label, $input) {
		var $choicesDropDown = $('<div>', {class: 'djpi-ac-drop'}),
			$choicesList = $('<ul>', {class: 'djpi-ac-choices-list'});

		$input.next('.djpi-ac-drop').remove();
		$choicesDropDown.append($choicesList);

		$.each(data, function(index, element) {
			var $option = $('<li>', {class: 'djpi-ac-text-input'}).text(element[field]);

    		$choicesList.append($option);
		});

		$input.after($choicesDropDown);
		$choicesDropDown.show();
	};

	/*
	Because we add and remove options from multi-select dynamically, on submit,
	we need to rebuild the "final" results from those that were selected.
	*/
  	var compileMultiSelectOptions = function($form) {
  		$form.find('.djpi-ac-container-multi').each(function() {
			var $select = $(this).prev('select');

			// Kill all since we will use '.djpi-ac-choice' entries.
			$select.empty();

			$(this).find('.djpi-ac-choice').each(function() {
				var selectedID = $(this).find('a').attr('id'),
					selectedLabel = $(this).find('a').parent().text(),
					$option = $('<option>', {value: selectedID}).text(selectedLabel);

				$option.prop('selected', true);
				$select.append($option);
			});
		});
  	};

  	/*
  	Clear all inputs and remove choices.
  	*/
  	var resetForm = function($button) {
  		var $form = $button.closest('form');

  		$form.find('input[type="text"]').val('');
  		$form.find('textarea').val('');
  		$form.find('select').empty();
  		$form.find('.djpi-ac-choice').remove();
		$form.find('.djpi-ac-choices-list').empty();
  	};

  	/*
  	Force the close of all styled drop downs.
  	*/
  	var closeAllDropDowns = function($el) {
  		$('.djpi-ac-drop').hide();
  	};
 
    /*
    Creates instances of all elements when initialized.
    Usage: $('form').djpiAutocomplete();
    */
    $.fn.djpiAutocomplete = function() {
    	return this.each(function() {
        	DJPIAutocomplete(this);
      	});
    };
 
}(jQuery));
