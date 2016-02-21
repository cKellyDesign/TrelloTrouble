window.TT = window.TT || {};

TT.api = {

  _get: function (path, callback, options) {
    Trello.get(path, (options || {}), callback, this.onRequestFailHandler);
  },

  getUserBoards: function (callback) {
    this._get('/members/me/boards', callback);
  },

  getBoardByID: function (id, callback) {
    this._get('/boards/' + id, callback, { lists: 'all' });
  },

  getListByID: function (id, callback) {
    this._get('/lists/' + id + '/cards', callback);
  },

  onRequestFailHandler: (function (self) {
    return function (error) {
      console.error(arguments[1], error.status, ':', error.responseText);
    };
  })(this),

};

var IndexView = Backbone.View.extend({
  
  events: { },

  template: _.template( $('#indexTemplate').html() ),

  authSettings: {
    name: "Trello Trouble",
      return_url: window.location.href,
      callback_method: "postMessage",
      type: "popup",
      interactive: true,
      expiration: "never",
      persist: true,
      scope: { write: true, read: true }
  },

  initialize: function () {
    this.authorize();
  },

  render: function () {
    this.$el.html(this.template({ boards: this.collection.toJSON() }));
  },

  getBoards: function () {
    var callback = _.bind(this.onGetBoard, this);
    _.each(this.collection.toJSON(), function (board, i){
      // console.log('boardIndex => board', board;
      TT.api.getBoardByID(board.id, callback);
    });

  },

  onIndexBoardClick: function (e) {
    e.preventDefault();
    var id = e.target.id,
        callback = _.bind(this.onGetBoard, this);
    TT.api.getBoardByID(id, callback);
  },

  onGetBoard: function (board) {
    // console.log('GOT BOARD!! ', board);
    board.cards = [];
    new BoardView({ el: $('#BoardView_' + board.id), model: new BoardModel(board) });
  },

  onUserBoards: function (boards) {
    var self = this;
    _.each(boards, function (board){
      self.collection.add(board);
    });
    this.render();
    this.getBoards();
  },

  authorize: function () {
    this.authSettings.success = _.bind(this.onAuthSuccess, this);
    this.authSettings.error = _.bind(this.onAuthFail, this);
    Trello.authorize(this.authSettings);
  },

  onAuthSuccess: function () {
    var callback = _.bind(this.onUserBoards, this);
    TT.api.getUserBoards(callback);
  },

  onAuthFail: function () { }

});

var BoardView = Backbone.View.extend({

  events: {},
  template: _.template($('#boardTemplate').html()),

  initialize: function () {
    this.render();
    this.initLists();
  },

  render: function () {
    this.$el.html(this.template(this.model.toJSON()));
  },

  initLists: function () {
    _.each((this.model.get('lists')), function (list, i) {
      new ListView({ el: '#ListView_' + list.id, model: new ListModel(list)});
    });
  }

});

var ListView = Backbone.View.extend({

  events: {},
  template: _.template($('#listTemplate').html()),
  
  initialize: function () {
    this.getListData();
  },

  render: function () {
    this.$el.html(this.template(this.model.toJSON()));
  },

  getListData: function () {
    var callback = _.bind(this.onGetList, this);
    TT.api.getListByID(this.model.get('id'), callback);
  },

  onGetList: function (cards) {
    // console.log(this.model.get('id'), 'got lists/id/cards: ', cards);
    this.model.set('cards', cards);
    this.render();
  }

});

var ListModel = Backbone.Model.extend();
var BoardModel = Backbone.Model.extend();

var MemberBoardCollection = Backbone.Collection.extend({});

TT.IndexView = new IndexView({ el: 'main', collection: new MemberBoardCollection() });