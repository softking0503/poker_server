var database = null;

exports.initdatabase = function (db) {
    database = db;
};
exports.userlogin = function (res, info) {
    var collection = database.collection('Admin_Data');
    collection.find(info).toArray(function (err, docs) {
        if (docs[0]) {
            res.json({
                message: 'success'
            });
        }
        else {
            res.json({
                message: 'failure'
            });
        }
    });
};
exports.getTotalUsers = function (res) {
    var collection = database.collection('User_Data');
    collection.find().toArray(function (err, docs) {
        res.json({
            message: '' + docs.length
        });

    });
};
exports.getOnlineUsers = function (res) {
    var collection = database.collection('User_Data');
    collection.find().toArray(function (err, docs) {
        var count = 0;
        for (let index = 0; index < docs.length; index++) {
            const element = docs[index];
            if (element.connect != '')
                count++;
        }
        res.json({
            message: '' + count
        });

    });
};
