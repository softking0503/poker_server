
var events = require('events');
var eventemitter = new events.EventEmitter();
var db = require('../database/mongodatabase');
var roommanager = require('../room_manager/roommanager');
var gamemanager = require('../game_manager/gamemanager');
var loginmanager = require('../room_manager/loginmanager');
var botmanager = require('../game_manager/botmanager');
var userdatabase = require('../database/userdatabase');
var gamelog = require('../game_manager/gamelog');
var database = null;

exports.initdatabase = function () {
    db.connect(function (err) {
        if (err) {
            gamelog.showlog(err);
            gamelog.showlog('Unable to connect to Mongo.');
            process.exit(1);
        }
        gamelog.showlog('Connected to the DB.');
        database = db.get();
        loginmanager.initdatabase(database);
        roommanager.initdatabase(database);
        gamemanager.initdatabase(database);
        userdatabase.initdatabase(database);
    });

    eventemitter.on('roomdelete', function (mydata) {
        roommanager.deleteroom(mydata);
    });
};

exports.initsocket = async function (socket, io) {
    loginmanager.setsocketio(io);
    roommanager.setsocketio(io);
    gamemanager.setsocketio(io);
    socket.on('CHECK_VERSION_CODE', async function () {
        await loginmanager.CheckVersionCode(socket);
    });
    socket.on('GET_ROOMS', async function(data) {
        await roommanager.getRooms(socket, data);
    });
    // LOGIN
    socket.on('REQ_LOGIN', async function (data) {
        await loginmanager.LogIn(socket, data);
    });
    // Register
    socket.on('REQ_REGISTER', async function (data) {
        await loginmanager.SignUp(socket, data);
    });
    socket.on('REQ_VALID_NAME', async function (data) {
        await loginmanager.Valid_Name(socket, data);
    });
    // upload profile_pic
    socket.on('UPLOAD_USER_PHOTO', async function (data) {
        await loginmanager.Get_User_Photo(data, socket);
    });
    // update photo_index
    socket.on('UDATE_PHOTO_INDEX', async function (data) {
        await loginmanager.Update_Photo_Index(data);
    });
    socket.on('REQ_PHOTO_TYPE', async function (data) {
        await loginmanager.Update_Photo_Type(data);
    });

    socket.on('REQ_ENTRANCE_AMOUNT', async function () {
        await roommanager.get_Entrance_Amount(socket);
    });
    socket.on('REQ_USER_INFO', async function (data) {
        await loginmanager.GetUserInfo(socket, data)
    });
    // Create Room
    socket.on('REQ_CREATE_ROOM', async function (data) {
        await roommanager.CreateRoom(socket, data);
    });
    // Join Room
    socket.on('REQ_ENTER_ROOM', async function (data) {
        await roommanager.JoinRoom(data, socket);
    });
    // Join Room _ID
    socket.on('REQ_ENTER_ROOM_ID', async function (data) {
        await roommanager.JoinRoom(data, socket);
    });
    socket.on('REQ_INVITE', async function (data) {
        // console.log(data,"req_rooms");
        await roommanager.InviteRoom(data);
    });
    socket.on('REQ_MESSAGES', async function (data) {
        await roommanager.GetUserMessages(socket, data);
    });
    socket.on('CHECKED_INVITE', async function (data) {
        await roommanager.CheckUserMessage(socket, data);
    });
    // Actions
    socket.on('PLAYER_ACTION', async function (data) {
        await roommanager.Action(data);
    });
    socket.on('PLAYER_PRE_ACTION', async function (data) {
        await roommanager.PreAction(data);
    });
    // Take a seat
    socket.on('REQ_TAKE_SEAT', async function (data) {
        await roommanager.SitDown(data, socket);
    });
    // Show cards
    socket.on('SHOW_CARDS', async function (data) {
        await gamemanager.ShowCards(data);
    });
    // Take a seat
    socket.on('REQ_WAIT_BB', async function (data) {
        await gamemanager.WaitForBB(socket, data);
    });
    // Cancel - Take a seat
    socket.on('REQ_CANCEL_TAKE_SEAT', async function (data) {
        await gamemanager.SitUp(socket, data);
    });
    // To view-mode
    socket.on('PLAYER_VIEW_TABLE', async function (data) {
        await roommanager.StandUp(data, socket);
    });
    // sitout by next hand
    socket.on('REQ_SIT_OUT', async function (data) {
        await gamemanager.SitOut(socket, data);
    });
    // send gift
    socket.on('REQ_GIFT', async function (data) {
        await gamemanager.SendGift(data);
    });

    // Buy-in
    socket.on('PLAYER_BUYIN', async function (data) {
        await roommanager.Buyin(data, socket);
    });
    //WAITING_PLAYERS
    socket.on('WAITING_PLAYERS', async function(data) {
        await roommanager.WaitingPlayers(data, socket);
    });
    // Spin
    socket.on('REQ_SPIN', async function (data) {
        await gamemanager.CheckSpin(socket, data);
    });
    socket.on('REQ_SPIN_SUCCESS', async function (data) {
        await gamemanager.SuccessSpin(socket, data);
    });
    // Chat
    socket.on('REQ_CHAT', async function (data) {
        await gamemanager.ChatMessage(socket, data);
    });
    //Public Chat
    socket.on('REQ_PUBLIC_CHAT', async function (data) {
        await gamemanager.PublicChatMessage(socket, data);
    });
    socket.on('REQ_PUBLIC_CHAT_LIST', async function (data) {
        await gamemanager.GetPublicChats(socket, data);
    });
    socket.on('SEND_CHAT', async function (data) {
        await roommanager.SendMessage(socket, data);
    });
    // Leave
    socket.on('PLAYER_LEAVE', async function (data) {
        await roommanager.Leave(data, socket);
        // gamemanager.PlayerLeave(socket, data);
    });
    // disconnect
    socket.on('disconnect', async function () {
        await roommanager.OnDisconnect(socket);
    });
    // check Reconnect
    socket.on('CheckReconnectGame', async function (data) {
        await roommanager.OnCheckReconnectGame(socket, data);
    });
    // create bot
    socket.on('CREATE_BOT', async function (data) {
        await botmanager.createBots(data);
    });
    // update user slot value
    socket.on('REQ_UPDATE_SLOT_VALUE', async function (data) {
        await loginmanager.UpdateUserSlotValue(socket, data);
    });
    
    // update user' balance
    socket.on('REQ_UPDATE_USERINFO_APP_BALANCE', async function (data) {
        await loginmanager.UpdateUserInfo_Balance(socket, data);
    });
    socket.on('REQUEST_ALL_PLAYER_RANKINGINFO', async function (data) {
        await loginmanager.Rankinginfo(data, socket);
    });
    //Mute, UnMute User
    socket.on('PLAYER_MUTE', async function(data) {
        await loginmanager.MutePlayer(socket, data);
    });
    socket.on('PLAYER_UNMUTE', async function(data) {
        await loginmanager.UnMutePlayer(socket, data);
    });
    socket.on('PLAYER_MUTELIST', async function(data) {
        await loginmanager.MuteList(socket, data);
    });
    // tournament list
    socket.on('REQ_TOUR_LIST', async function (data) {
        await gamemanager.getTournaments(socket, data);
    });
    // tournament register
    socket.on('REQ_TOUR_REGISTER', async function (data) {
        await gamemanager.regTournaments(socket, data);
    });
    socket.on('REQ_CHECK_REFFERAL', async function (data) {
        await roommanager.CheckRefferal(socket, data);
    });
    socket.on('SHARE_REFFERAL_SUCCESS_RESULT', async function (data) {
        await roommanager.SHARE_REFFERAL_SUCCESS_RESULT(socket, data);
    });
    socket.on('REQ_FRIEND', async function (data) {
        await roommanager.Request_Friend(data);
    });
    socket.on('ACCEPT_FRIEND', async function (data) {
        await roommanager.Accept_Friend(socket, data);
    });
    socket.on('REQ_CANCEL_FRIEND', async function (data) {
        await roommanager.Request_Cancel_Friend(socket, data);
    });
    socket.on('REQ_BUDDIES', async function (data) {
        await roommanager.Request_Buddies_List(socket, data);
    });
    socket.on('REQ_BUDDIES1', async function (data) {
        await roommanager.Request_Buddies_List1(socket, data);
    });
    socket.on('REQ_RECENTS', async function (data) {
        await roommanager.Request_Recents_List(socket, data);
    });
    socket.on('REQ_CHATS', async function (data) {
        await roommanager.Request_Chat_List(socket, data);
    });
    socket.on('REQ_CHATS1', async function (data) {
        await roommanager.Request_Chat_List1(socket, data);
    });
    socket.on('REQ_MyChips', async function (data) {
        await roommanager.Request_User_Balance(socket, data);
    });
    socket.on('INIT_CONNECT', async function (data) {
        await loginmanager.INIT_CONNECT(socket, data);
    });
    socket.on('REPORT_MESSAGE', async function (data) {
        await loginmanager.Report_Message(socket, data);
    });

    socket.on('UPDATE_ARCHIVEMENT', async function (data) {
        await gamelog.showlog('1323132')
        loginmanager.Update_Archivement(socket, data);
    });
    //------------------Vuejs Admin----------------------
    socket.on('GET_TOTAL_USERS', async function () {
        await roommanager.GetTotalUsers();
    });
    socket.on('GET_ONLINE_USERS', async function () {
        await roommanager.GetOnlineUsers();
    });
 
    socket.on('GET_USER_LIST', async function () {
        await roommanager.GetUserList();
    });
    socket.on('GET_VERIFY', async function () {
        await roommanager.GetVerify(socket);
    });
    socket.on('UPDATE_USER', async function (data) {
        await loginmanager.updateProfile(socket, data);
    });

    //----------------Admin & Seller Panel----------------------
    socket.on('PANEL_LOGIN', async function (data) {
        await loginmanager.panel_login(socket, data);
    });
    socket.on('ADMIN_LOGIN', async function (data) {
        await loginmanager.admin_panel_login(socket, data);
    });
    socket.on('ADMIN_REMOVE_CHAT', async function (data) {
        await loginmanager.admin_remove_chat(socket, data);
    });
    socket.on('ADMIN_REMOVE_ALL_CHAT', async function (data) {
        await loginmanager.admin_remove_all_chat(socket, data);
    });
    socket.on('SEND_CHIPS', async function (data) {
        await loginmanager.send_chips(socket, data);
    });
    socket.on('ADMIN_SEND_CHIPS', async function (data) {
        await loginmanager.admin_send_chips(socket, data);
    });
    socket.on('ADMIN_REMOVE_CHIPS', async function (data) {
        await loginmanager.admin_remove_chips(socket, data);
    });
    socket.on('TRANS_HISTORY', async function (data) {
        await loginmanager.trans_history(socket, data);
    });
    socket.on('SET_BLOCK', async function (data) {
        await loginmanager.set_block(socket, data);
    });
    socket.on('GET_REPORTS', async function () {
        await loginmanager.getRports(socket);
    });
    socket.on('SEND_NOTICE', async function (data) {
        await loginmanager.send_Notice(socket, data);
    });
    socket.on('SEND_Mail', async function (data) {
        await loginmanager.send_Mail(socket, data);
    });
    socket.on('REQ_MAIL', async function (data) {
        await loginmanager.req_Mail(socket, data);
    });
    socket.on('REMOVE_MAIL', async function(data) {
        await loginmanager.remove_Mail(socket, data);
    });
    socket.on('REMOVE_ALLMAIL', async function(data) {
        await loginmanager.remove_AllMail(socket, data);
    });
    socket.on('UPDATE_MAILDATE', async function(data) {
        await loginmanager.update_MailDate(socket, data);
    });
}