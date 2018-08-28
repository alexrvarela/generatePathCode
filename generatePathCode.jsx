//
//  generatePathCode.jsx
//
//  Created by Alejandro Ramirez Varela.
//  Copyright © 2018 Alejandro Ramirez Varela. All rights reserved.
//
//  Licensed under the MIT License
//

var paths = new Array();

//TODO: Work with ansolute and relative points
//TODO: Generate SVG path string

var languages = [
                "UIBezierPath - Swift", //0
                "UIBezierPath - Objc",//1
                "CGPath - Swift" ,//2
                "CGPath - Objc",//3
                "EPS string"//4
                ];

var _templates_instance = [
                           "let /v/ = UIBezierPath()\n",//0 Swift - UIBezierPath
                           "UIBezierPath* /v/ = [[UIBezierPath alloc] init];\n",//1 Objc - UIBezierPath
                           "let /v/ = CGMutablePath.init()\n",//2 Swift - CGPath
                           "CGMutablePathRef /v/ = CGPathCreateMutable();\n",//3 Objc - CGPath
                           ""//4 EPS String N/A
                           // "d=\""//SVG
                           ];


var _templates_move_to = [
                          "/v/.move(to: CGPoint(x:/x/, y:/y/) )\n",//0 Swift - UIBezierPath
                          "[/v/ moveToPoint:CGPointMake(/x/, /y/)];\n",//1 Objc - UIBezierPath
                          "/v/.move(to: CGPoint(x:/x/, y:/y/) )\n",//2 Swift - CGPath
                          "CGPathMoveToPoint(/v/, NULL, /x/, /y/);\n",//3 Objc - CGPath
                          "/x/ /y/ m\n"//4 EPS String, m or M is moveToPoint.
                          //"M/x/,/y/ " //SVG
                          ];

var _templates_line_to = [
                          "/v/.addLine(to: CGPoint(x:/x/, y:/y/) )\n",//0 Swift - UIBezierPath
                          "[/v/ addLineToPoint:CGPointMake(/x/, /y/)];\n",//1 Objc - UIBezierPath
                          "/v/.addLine(to: CGPoint(x:/x/, y:/y/) )\n",//2 Swift - CGPath
                          "CGPathAddLineToPoint(/v/, NULL, /x/, /y/);\n",//3 Objc - CGPath
                          "/x/ /y/ l\n"//4 EPS String, l or L  is "line to point".
                          //SVG
                          ];

var _templates_curve_from = [
                             "/v/.addQuadCurve(to: CGPoint(x:/x/, y:/y/), controlPoint: CGPoint(x:/cx/, y:/cy/))\n",//0 Swift - UIBezierPath
                             "[/v/ addQuadCurveToPoint:CGPointMake(/x/, /y/) controlPoint:CGPointMake(/cx/ , /cy/)];\n",//1 Objc - UIBezierPath
                             "/v/.addQuadCurve(to: CGPoint(x:/x/, y:/y/), control: CGPoint(x:/cx/, y:/cy/))\n",//2 Swift - CGPath
                             "CGPathAddQuadCurveToPoint(/v/, NULL, /cx/, /cy/, /x/, /y/);\n",//3 Objc - CGPath
                             "/cx/ /cy/ /x/ /y/ y\n"//4 EPS String, y or Y is "curve from only".
                             //SVG
                             ];

var _templates_curve_to = [
                           "/v/.addQuadCurve(to: CGPoint(x:/x/, y:/y/), controlPoint: CGPoint(x:/cx/, y:/cy/))\n",//0 Swift - UIBezierPath
                           "[/v/ addQuadCurveToPoint:CGPointMake(/x/, /y/) controlPoint:CGPointMake(/cx/ , /cy/)];\n",//1 Objc - UIBezierPath
                           "/v/.addQuadCurve(to: CGPoint(x:/x/, y:/y/), control: CGPoint(x:/cx/, y:/cy/))\n",//2 Swift - CGPath
                           "CGPathAddQuadCurveToPoint(/v/, NULL, /cx/, /cy/, /x/, /y/);\n",//3 Objc - CGPath
                           "/cx/ /cy/ /x/ /y/ v\n"//4 EPS String, v or V is "curve to only".
                           //SVG
                           ];

var _templates_curve_from_and_to = [
                                    "/v/.addCurve(to: CGPoint(x:/x/, y:/y/), controlPoint1: CGPoint(x:/cx1/, y:/cy1/), controlPoint2: CGPoint(x:/cx2/, y:/cy2/))\n",//0 Swift - UIBezierPath
                                    "[/v/ addCurveToPoint:CGPointMake(/x/, /y/) controlPoint1:CGPointMake(/cx1/ , /cy1/) controlPoint2:CGPointMake(/cx2/ , /cy2/)];\n",//1 Objc - UIBezierPath
                                    "/v/.addCurve(to: CGPoint(x:/x/, y:/y/), control1: CGPoint(x:/cx1/, y:/cy1/), control2: CGPoint(x:/cx2/, y:/cy2/))\n",//2 Swift - UIBezierPath
                                    "CGPathAddCurveToPoint(/v/, NULL, /cx1/, /cy1/, /cx2/, /cy2/, /x/, /y/);\n",//3 Objc - CGPath
                                    "/cx1/ /cy1/ /cx2/ /cy2/ /x/ /y/ c\n"//4 EPS String, c or C is "curve from and to"
                                    //SVG
                                    ];

var _templates_close_path = [
                             "/v/.close()",//0 Swift - UIBezierPath
                             "[/v/ closePath];",//1 Objc - UIBezierPath
                             "/v/.closeSubpath()",//2 Swift - CGPath
                             "CGPathCloseSubpath(/v/);",//3 Objc - CGPath
                             "f"//4 EPS String, f or F is "close this subpath and start a new one."
                             //SVG
                             ];

function getPaths(group)
{
    //Get path items from selection

    //compoundPathItems
    if (group.compoundPathItems != null)
    {
        for (var i = 0; i < group.compoundPathItems.length; i++)
        {
            paths.push(group.compoundPathItems[i]);
        }
    }
    
    //pathItems
    if (group.pathItems != null)
    {
        for (var i = 0; i < group.pathItems.length; i++)
        {
            paths.push(group.pathItems[i]);
        }
    }
    
    //groupItems
    if (group.groupItems != null)
    {
        for (var i = 0; i < group.groupItems.length; i++)
        {
            getPaths(group.groupItems[i]);
        }
    }
}

if ( app.documents.length > 0 )
{
    //Get active document
    var doc =  app.activeDocument;
    
    //clean groups and return pathItem list
    
    if ( doc.selection != null && doc.selection.length > 0 )
    {
        var selection = doc.selection;
        
        //clean groups and get path items only
        for(var i = 0; i < selection.length; i++)
        {
            //scan for selection Groups
            if (selection[i].typename == "GroupItem" )
            {
                getPaths(selection[i]);
            }
            
            //push selection paths
            if (selection[i].typename == "CompoundPathItem" || selection[i].typename == "PathItem" )
            {
                paths.push(selection[i]);
            }
        }

        if (paths.length == 0) {alert("Select one or more paths to generate code.");}
        
        var activeArtboard = doc.artboards[ doc.artboards.getActiveArtboardIndex() ];
        var activeArtboardRect = activeArtboard.artboardRect;
        
        //Build UI
        var box = new Window("dialog{text:'Bezier Path Code Generator'}");
        box.preferredSize = [300, 0];
        
        //Options group
        var optionsGroup = box.add('group', undefined, 'Path Options');
        optionsGroup.alignment = 'fill';
        optionsGroup.orientation = 'row';
        
        //Field variable name
        var varNameGroup = optionsGroup.add('group', undefined, 'varName');
        varNameGroup.alignment = 'fill';
        varNameGroup.orientation = 'column';
        varNameGroup.add ('statictext' , undefined, 'Name your variable:');
        
        var inputVarName = varNameGroup.add('edittext', undefined, 'myPath');
        inputVarName.justify = 'left';
        inputVarName.minimumSize.width = 150;
        inputVarName.onChange = function()
        {
            generateCode();
        }
        
        //Dropdown selector
        var selectorGroup = optionsGroup.add('group', undefined, 'selector');
        selectorGroup.alignment = 'left';
        selectorGroup.orientation = 'column';
        selectorGroup.add('statictext' , undefined, 'Select otput type:');
        
        var dropDownList = selectorGroup.add('DropDownList', undefined, languages);
        dropDownList.minimumSize.width = 150;
        dropDownList.selection = 0;
        dropDownList.onChange = function()
        {
            generateCode();
        }
        
        box.add('statictext' , undefined, 'Flip coordinate axis :');
        var checkboxGroup = box.add('group', undefined, 'Checkboxs');
        checkboxGroup.alignment = 'fill';
        checkboxGroup.orientation = 'row';
        
        var checkboxFlipX = checkboxGroup.add('checkbox' , undefined, 'flip x');
        checkboxFlipX.onClick = function()
        {
            generateCode();
        }
        
        var checkboxFlipY = checkboxGroup.add('checkbox' , undefined, 'flip y');
        checkboxFlipY.value = true;
        checkboxFlipY.onClick = function()
        {
            generateCode();
        }
        
        //radio group
        box.add('statictext' , undefined, 'Origin point related to :');
        var radioGroup = box.add('group', undefined, 'Path Objects Size:');
        radioGroup.alignment = 'fill';
        radioGroup.orientation = 'row';
        
        // Radio Buttons for Larger than, or smaller than
        //[15, 15, 100, 35]
        var radio1 = radioGroup.add('radiobutton', undefined, 'Document' );
        radio1.helpTip = "Help tip 1";
        radio1.onClick = function()
        {
            generateCode();
        }
        
        var radio2 = radioGroup.add('radiobutton', undefined, 'Artboard' )
        radio2.value = true;
        radio2.helpTip = "Help tip 2";
        radio2.onClick = function()
        {
            generateCode();
        }
        
        var radio3 = radioGroup.add('radiobutton', undefined, 'Zero' )
        radio3.helpTip = "Help tip 3";
        radio3.onClick = function()
        {
            generateCode();
        }
        
        //Field otuput
        box.add ('statictext' , undefined, 'Code:');
        
        var fieldOutput = box.add('edittext', undefined, 'Code', {multiline:true});
        fieldOutput.minimumSize.width = 320;
        fieldOutput.minimumSize.height = 95;
        
        //Buttons group
        var buttonsGroup = box.add('group', undefined, 'Buttons');
        buttonsGroup.alignment = 'fill';
        buttonsGroup.orientation = 'row';
        
        //TODO:Copy to clippoard
        /*
        var copyButton = buttonsGroup.add('button', undefined, 'Copy', {name:'Copy'});
        copyButton.minimumSize.width = 100;
        
        copyButton.onClick = function()
        {
            copyToClippboard()
        }
        /*
        
        //TODO:Save text file
        /*
        var saveButton = buttonsGroup.add('button', undefined, 'Save', {name:'Save'});
        saveButton.minimumSize.width =100;
        saveButton.onClick = function()
        {
            saveFileText()
        }
        */
        
        //Close button
        var closeButton = buttonsGroup.add('button', undefined, 'Close', {name:'Close'});
        closeButton.minimumSize.width = 100;
        
        closeButton.onClick = function()
        {
            box.close();
        }
        
        box.onShow  = function()
        {
            generateCode();
        }
        
        box.show();

        /*
        TODO:
        function saveFileText(dest)
        {
            
        }
        
        function copyToClippboard()
        {
            
        }*/

        
        //helpers
        function distance(P1, P2)
        {
            var a = P1[0] - P2[0];
            var b = P1[1] - P2[1];
            
            return Math.sqrt(a * a + b * b);
        }
        
        function roundDecimals(value)
        {
            return Math.round(value * 10000 ) / 10000;
        }
        
        function getPathItem(group)
        {
            for (var i = 0; i < group.length; i++)
            {
                if (group[i].typename == "PathItem"  || group[i].typename == "CompoundPathItem")
                {
                    return group[i];
                }else if (group[i].typename == "GroupItem")
                {
                    getPathItem(group[i])
                }
            }
            
            return null;
        }

        function generateCode()
        {
            fieldOutput.text = "Generating code...";

            var stringPath = "";
            
            for(var i = 0; i < paths.length; i++)
            {
                var varName = inputVarName.text;
                if (i > 0){varName =  varName + i;}

                var bounds = paths[i].geometricBounds;

                var _translate_x = 0.0;
                var _translate_y = 0.0;
                
                //Space location
                if(radio1.value == true)
                {
                    //Document
                }
                else if(radio2.value == true)
                {
                    //Artboard
                    _translate_x = - activeArtboardRect[0];
                    _translate_y = - activeArtboardRect[1];
                    
                }
                else if(radio3.value == true)
                {
                    //Zero
                    _translate_x = - bounds[0];
                    _translate_y = - bounds[1];
                }
                
                //Build
                var mode = 0 + dropDownList.selection;//force int
                
                //Instance    
                stringPath = stringPath + _templates_instance[mode].replace("/v/", varName);

                if(paths[i].typename == "PathItem")
                {
                    //Single path
                    stringPath = stringPath + generatePathString(paths[i], varName, bounds, _translate_x, _translate_y);
                }
                else if(paths[i].typename == "CompoundPathItem")
                {
                    //Compound path
                    for (var j = paths[i].pathItems.length - 1; j >= 0; j--) 
                    {
                        stringPath = stringPath + generatePathString(paths[i].pathItems[j], varName, bounds, _translate_x, _translate_y);
                    }
                }
                
                //TODO:close path

                /*
                if(paths[i].closed)
                {
                    stringPath = stringPath + _templates_close_path[mode].replace("/v/", varName);;
                }
                */

                if((i + 1) < paths.length){ stringPath = stringPath + "\n"; }
            }
                
            fieldOutput.text = stringPath;
        }
        
        function generatePathString(pathItem, varName, bounds, _translate_x, _translate_y)
        {
            var stringPath = "";

            var points = pathItem.pathPoints;
            var mode = 0 + dropDownList.selection;//force int
            
            var _x = ( points[0].anchor[0] + _translate_x );
            var _y = ( points[0].anchor[1] + _translate_y );
            
            _x = roundDecimals(_x);
            _y = roundDecimals(_y);
            
            if (checkboxFlipX.value == true)
            {
                _x = _x * -1;
            }
            
            if (checkboxFlipY.value == true)
            {
                _y = _y * -1;
            }
            
            //Move to
            var stringMoveTo = _templates_move_to[mode].replace("/v/", varName);
            stringMoveTo = stringMoveTo.replace("/x/", "" + _x);
            stringMoveTo = stringMoveTo.replace("/y/", "" + _y);
            stringPath = stringPath + stringMoveTo;
            
            for(var pointIndex= 0; pointIndex < points.length; pointIndex++)
            {
                var count = 1;
                var nextIndex = 0;
                
                var currentPoint = points[pointIndex];//current point
                if(pointIndex< (points.length - 1) ){nextIndex = pointIndex+ 1}
                var nextPoint = points[nextIndex];//next point
                
                //TODO: is closed?
                var currentAnchor = currentPoint.anchor;
                var nextAnchor = nextPoint.anchor;
                
                var currentLeft = currentPoint.rightDirection;
                var nextRigth = nextPoint.leftDirection;
                
                var currentDistanceLeft = distance(currentAnchor, currentLeft);
                var nextDistanceRight = distance(nextAnchor, nextRigth);
                
                if  (currentDistanceLeft > 0){count++;}
                if (nextDistanceRight > 0){count++;}
                
                if (count == 1)
                {
                    //Linear
                    _x = ( nextAnchor[0] + _translate_x );
                    _y = ( nextAnchor[1] + _translate_y );
                    
                    //Round decimals
                    _x = roundDecimals(_x);
                    _y = roundDecimals(_y);
                    
                    //Flip axis
                    if (checkboxFlipX.value == true)
                    {
                        _x = _x * -1;
                    }
                    
                    if (checkboxFlipY.value == true)
                    {
                        _y = _y * -1;
                    }
                    
                    //Line to
                    var stringLineTo = _templates_line_to[mode].replace("/v/", varName);
                    stringLineTo = stringLineTo.replace("/x/", "" + _x);
                    stringLineTo = stringLineTo.replace("/y/", "" + _y);
                    stringPath = stringPath + stringLineTo;
                }
                else if (count == 2)
                {
                    //Quad
                    var _cx;
                    var _cy;
                    
                    if  (currentDistanceLeft > 0)
                    {
                        _x = ( nextAnchor[0] + _translate_x );
                        _y = ( nextAnchor[1] + _translate_y );
                        _cx = ( currentLeft[0] + _translate_x );
                        _cy = ( currentLeft[1] + _translate_y );
                    }
                    else
                    {
                        _x = ( nextAnchor[0] + _translate_x );
                        _y = ( nextAnchor[1] + _translate_y );
                        _cx = ( nextRigth[0] + _translate_x );
                        _cy = ( nextRigth[1] + _translate_y );
                    }
                    
                    _x = roundDecimals(_x);
                    _y = roundDecimals(_y);
                    _cx = roundDecimals(_cx);
                    _cy = roundDecimals(_cy);
                    
                    if (checkboxFlipX.value == true)
                    {
                        _x = _x * -1;
                        _cx = _cx * -1;
                    }
                    
                    if (checkboxFlipY.value == true)
                    {
                        _y = _y * -1;
                        _cy = _cy * -1;
                    }
                    
                    if  (currentDistanceLeft > 0)
                    {
                        //curve from
                        var stringCurveFrom = _templates_curve_from[mode].replace("/v/", varName);
                        stringCurveFrom = stringCurveFrom.replace("/x/", "" + _x);
                        stringCurveFrom = stringCurveFrom.replace("/y/", "" + _y);
                        stringCurveFrom = stringCurveFrom.replace("/cx/", "" + _cx);
                        stringCurveFrom = stringCurveFrom.replace("/cy/", "" + _cy);
                        stringPath = stringPath + stringCurveFrom;
                        
                    }else
                    {
                        //curve to
                        var stringCurveTo = _templates_curve_to[mode].replace("/v/", varName);
                        stringCurveTo = stringCurveTo.replace("/x/", "" + _x);
                        stringCurveTo = stringCurveTo.replace("/y/", "" + _y);
                        stringCurveTo = stringCurveTo.replace("/cx/", "" + _cx);
                        stringCurveTo = stringCurveTo.replace("/cy/", "" + _cy);
                        stringPath = stringPath + stringCurveTo;
                    }
                }
                else if (count == 3)
                {
                    //Cubic
                    _x = ( nextAnchor[0] + _translate_x );
                    _y = ( nextAnchor[1] + _translate_y );
                    
                    var _cx1 = ( currentLeft[0] + _translate_x );
                    var _cy1 = ( currentLeft[1] + _translate_y );
                    
                    var _cx2 = ( nextRigth[0] + _translate_x );
                    var _cy2 = ( nextRigth[1] + _translate_y );
                    
                    _x = roundDecimals(_x);
                    _y = roundDecimals(_y);
                    _cx1 = roundDecimals(_cx1);
                    _cy1 = roundDecimals(_cy1);
                    _cx2 = roundDecimals(_cx2);
                    _cy2 = roundDecimals(_cy2);
                    
                    if (checkboxFlipX.value == true)
                    {
                        _x = _x * -1;
                        _cx1 = _cx1 * -1;
                        _cx2 = _cx2 * -1;
                    }
                    
                    if (checkboxFlipY.value == true)
                    {
                        _y = _y * -1;
                        _cy1 = _cy1 * -1;
                        _cy2 = _cy2 * -1;
                    }
                    
                    //
                    var stringCurveFromAndTo = _templates_curve_from_and_to[mode].replace("/v/", varName);
                    stringCurveFromAndTo = stringCurveFromAndTo.replace("/x/", "" + _x);
                    stringCurveFromAndTo = stringCurveFromAndTo.replace("/y/", "" + _y);
                    stringCurveFromAndTo = stringCurveFromAndTo.replace("/cx1/", "" + _cx1);
                    stringCurveFromAndTo = stringCurveFromAndTo.replace("/cy1/", "" + _cy1);
                    stringCurveFromAndTo = stringCurveFromAndTo.replace("/cx2/", "" + _cx2);
                    stringCurveFromAndTo = stringCurveFromAndTo.replace("/cy2/", "" + _cy2);
                    stringPath = stringPath + stringCurveFromAndTo;
                }
            }

            return stringPath;
        }
    }
    else
    {
        alert("Select one or more paths to generate code.");
    }
}
else
{
    alert("Select one or more paths to generate code.");
}




