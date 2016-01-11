//
//  Lansite Client Box Template
//  By Tanner Krewson
//

//Ctrl+H replace TemplateBox with what you will be calling your custom box,
//	and make sure to name your file the same name.

TemplateBox.prototype = Object.create(Box.prototype);

function TemplateBox(data) {
    Box.call(this, data.id, data.unique);

    //data is a full copy of this box's corresponding server-side object
}

//@Override
TemplateBox.prototype.show = function() {
    
    //Runs the parent show function
    Box.prototype.show.call(this);

    //Place any custom code here

}

//@Override
TemplateBox.prototype.update = function() {

    //Runs the parent update function
    Box.prototype.update.call(this);

    //Place any custom code here
    
}