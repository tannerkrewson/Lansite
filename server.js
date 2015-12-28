//
//  Lansite Server
//  By Tanner Krewson
//

//
//  INITIAL SETUP
//

//requires
var crypto = require('crypto');
var readline = require('readline');
var express = require('express');
var socketio = require('socket.io');
var app = express();


//console
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('lansite> ');
rl.prompt();
rl.on('line', function(line) {
    if (line === "stop") rl.close();
    if (line === "users") console.log(mainDispatcher.users.listAllUsers());
    if (line === "add initial") mainStream.addBoxAndSend(new Box('InitialBox'), mainDispatcher);
    if (line.startsWith("add text")) mainStream.addBoxAndSend(new TextBox('TextBox', line.substr(9, line.length)), mainDispatcher);
    if (line === "add vote") console.log('Add choices after command, seperated by spaces.');
    if (line.startsWith("add vote ")) mainStream.addBoxAndSend(new VoteBox('VoteBox', line.substr(9, line.length).split(' ')), mainDispatcher);
    if (line === "test") console.log(mainStream.listAllBoxes());
}).on('close', function() {
    process.exit(0);
});


//handlebars setup
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


//express stuff
app.use(express.static(__dirname + '/public'));


//url mapping
app.get('/', function(req, res) {
    res.render('home');
});


//start server
var io = socketio.listen(app.listen(3000, function() {
    console.log('Lansite is now runnning. Type "exit" to close.');
}));



//
//  OBJECTS
//

function Stream() {
    this.boxes = [];
}

Stream.prototype.addBoxAndSend = function(boxToAdd, dispatcher) {
    //adds the box to the server-side stream
    this.boxes.push(boxToAdd);

    //sends the box to everyone
    dispatcher.sendNewBoxToAll(boxToAdd);
};

Stream.prototype.showAll = function() {
    //clear all from screen
    this.clearAll();

    //this is so that the elements are shown in decsending chonological order
    //slice makes the array copy by val instead of ref
    var tempArray = this.boxes.slice().reverse();
    tempArray.forEach(function(element) {
        element.show();
    });

};

Stream.prototype.clearAll = function() {
    $('#stream').empty();
};

Stream.prototype.listAllBoxes = function() {
    var result = '';
    this.boxes.forEach(function(box) {
        result += box.unique + "\n";
    });
    return result;
}



function Box(templateID) {
    this.id = templateID;
    this.unique = crypto.randomBytes(20).toString('hex');
}



TextBox.prototype = Object.create(Box.prototype);

function TextBox(id, text) {
    Box.call(this, id);
    this.text = text;
}

TextBox.prototype.changeText = function(text) {
    this.text = text;
}



VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(id, arrayOfChoices) {
    Box.call(this, id);
    this.choices = arrayOfChoices;
    this.votes = [];
}

VoteBox.prototype.vote = function(indexOfChoice) {
    //make sure the spot in the array has integer
    if (this.votes[indexOfChoice] === undefined) this.votes[indexOfChoice] = 0;

    //add 1 to the vote at the specific index
    this.votes[indexOfChoice]++;

    console.log('There are now ' + this.votes[indexOfChoice] + ' votes for ' + this.choices[indexOfChoice]);
}

VoteBox.prototype.getNumberOfVotes = function(indexOfChoice) {
    return this.votes[indexOfChoice];
}



function Dispatcher() {
    this.users = new Users();
}

Dispatcher.prototype.sendCurrentStream = function(userToReceiveStream) {
    userToReceiveStream.socket.emit('newStream', mainStream.boxes);
    console.log('Sent stream to ' + userToReceiveStream.unique);
}

Dispatcher.prototype.sendNewBoxToAll = function(box) {
    //loop through all users
    mainDispatcher.users.list.forEach(function(element) {
        element.socket.emit('newBox', box);
    });
}



function Users() {
    this.list = [];
}

Users.prototype.addNewUser = function(socket) {
    var tempUser = new User(socket);
    console.log(tempUser.unique);
    this.list.push(tempUser);
    return tempUser;
}

Users.prototype.removeUser = function(userToRemove) {
    var indexToRemove = this.list.indexOf(userToRemove);
    if (indexToRemove > -1) {
        this.list.splice(indexToRemove, 1);
    }
}

Users.prototype.listAllUsers = function() {
    var result = '';
    this.list.forEach(function(element) {
        result += element.unique + "\n";
    });
    return result;
}



function User(socket) {
    this.unique = crypto.randomBytes(20).toString('hex');
    this.socket = socket;
}



//
//  MAIN CODE
//

//main object creation
var mainDispatcher = new Dispatcher();
var mainStream = new Stream();

//handles users coming and going
io.on('connection', function(socket) {
    console.log('User connected');
    var user = mainDispatcher.users.addNewUser(socket);

    mainDispatcher.sendCurrentStream(user);

    //handles votes
    socket.on('vote', function(msg) {

        //search for the corresponding VoteBox using its unique
        mainStream.boxes.forEach(function(box) {
            if (box.unique === msg.voteBoxUnique) {
                //cast the vote based on the index of the choice
                box.vote(msg.index);

                //temporary until i get around to implementing something better
                mainDispatcher.users.list.forEach(function(tempUser){
                    mainDispatcher.sendCurrentStream(tempUser);
                });
            }
        });
    });

    socket.on('disconnect', function() {
        console.log('User disconnected');
        mainDispatcher.users.removeUser(user);
    });
});