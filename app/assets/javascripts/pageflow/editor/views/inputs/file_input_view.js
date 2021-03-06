/**
 * Input view to reference a file.
 *
 * @class
 * @memberof module:pageflow/editor
 */
pageflow.FileInputView = Backbone.Marionette.ItemView.extend({
  mixins: [pageflow.inputView],

  template: 'pageflow/editor/templates/inputs/file_input',
  className: 'file_input',

  ui: {
    fileName: '.file_name',
    thumbnail: '.file_thumbnail'
  },

  events: {
    'click .choose': function() {
      pageflow.editor.selectFile(
        {
          name: this.options.collection.name,
          filter: this.options.filter
        },
        this.options.fileSelectionHandler || 'pageConfiguration',
        _.extend({
          id: this.model.getRoutableId ? this.model.getRoutableId() : this.model.id,
          attributeName: this.options.propertyName,
          returnToTab: this.options.parentTab
        }, this.options.fileSelectionHandlerOptions || {})
      );

      return false;
    },

    'click .unset': function() {
      this.model.unsetReference(this.options.propertyName);
      return false;
    }
  },

  initialize: function() {
    this.options = _.extend({
      positioning: true,
      textTrackFiles: pageflow.textTrackFiles
    }, this.options);

    if (typeof this.options.collection === 'string') {
      this.options.collection = pageflow.entry.getFileCollection(
        pageflow.editor.fileTypes.findByCollectionName(this.options.collection)
      );
    }
  },

  onRender: function() {
    this.update();
    this.listenTo(this.model, 'change:' + this.options.propertyName, this.update);

    var dropDownMenuItems = this._dropDownMenuItems();

    if (dropDownMenuItems.length) {
      this.appendSubview(new pageflow.DropDownButtonView({
        items: dropDownMenuItems
      }));
    }
  },

  update: function() {
    var file = this._getFile();

    this.$el.toggleClass('is_unset', !file);
    this.ui.fileName.text(file ?
                          file.get('file_name') :
                          I18n.t('pageflow.ui.views.inputs.file_input_view.none'));

    this.subview(new pageflow.FileThumbnailView({
      el: this.ui.thumbnail,
      model: file
    }));
  },

  _dropDownMenuItems: function() {
    var file = this._getFile(file);
    var items = new Backbone.Collection();

    if (this.options.defaultTextTrackFilePropertyName && file) {
      items.add({
        name: 'default_text_track',
        label: I18n.t('pageflow.editor.views.inputs.file_input.default_text_track'),
        items: this._textTrackMenuItems(
          file.nestedFiles(this.options.textTrackFiles)
        )
      });
    }

    if (this.options.positioning && file && file.isPositionable()) {
      items.add(new pageflow.FileInputView.EditBackgroundPositioningMenuItem({
        name: 'edit_background_positioning',
        label: I18n.t('pageflow.editor.views.inputs.file_input.edit_background_positioning')
      }, {
        inputModel: this.model,
        propertyName: this.options.propertyName,
        filesCollection: this.options.collection
      }));
    }

    return items;
  },

  _textTrackMenuItems: function(textTrackFiles) {
    var models = [null].concat(textTrackFiles.toArray());

    return new Backbone.Collection(models.map(function(textTrackFile) {
      return new pageflow.FileInputView.DefaultTextTrackFileMenuItem({}, {
        textTrackFiles: textTrackFiles,
        textTrackFile: textTrackFile,
        inputModel: this.model,
        propertyName: this.options.defaultTextTrackFilePropertyName
      });
    }, this));
  },

  _getFile: function() {
    return this.model.getReference(this.options.propertyName, this.options.collection);
  }
});

pageflow.FileInputView.EditBackgroundPositioningMenuItem = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.options = options;
  },

  selected: function() {
    pageflow.BackgroundPositioningView.open({
      model: this.options.inputModel,
      propertyName: this.options.propertyName,
      filesCollection: this.options.filesCollection
    });
  }
});

pageflow.FileInputView.DefaultTextTrackFileMenuItem = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.options = options;

    this.listenTo(this.options.inputModel, 'change:' + this.options.propertyName, this.update);
    this.update();
  },

  update: function() {
    this.set('checked', this.options.textTrackFile == this.getDefaultTextTrackFile());
    this.set('name', this.options.textTrackFile ? null : 'no_default_text_track');
    this.set('label', this.options.textTrackFile ?
             this.options.textTrackFile.label() :
             I18n.t('pageflow.editor.views.inputs.file_input.no_default_text_track'));
  },

  selected: function() {
    if (this.options.textTrackFile) {
      this.options.inputModel.setReference(this.options.propertyName, this.options.textTrackFile);
    }
    else {
      this.options.inputModel.unsetReference(this.options.propertyName);
    }
  },

  getDefaultTextTrackFile: function() {
    return this.options.inputModel.getReference(
      this.options.propertyName,
      this.options.textTrackFiles
    );
  }
});