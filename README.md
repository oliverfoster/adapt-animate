adapt-animate
=============

On events at elements(onSelector), add or remove classes/attributes/content(alterationSelector) to elements(toSelector) on selected pages/articles/blocks/components.

###Usage
  
To go in: 
  
  contentObjects.json  
  articles.json  
  blocks.json  
  components.json  
  
###Example - Accordion fadeIn and shake items

To go in components.json  

Description: 500 milliseconds after the first inview event, fade in the accordion for 1 second and start shaking each item for 1 second, infinitely, decending, in-turn, at intervals of 250 milliseconds.
```
{
  "_animate": {
    "_isEnabled": true,
    "_animations": [
      {
        "_id": "accordion-fadeIn-shake-items",
        "_components": [
          {
            "_component": "accordion"
          }
        ],
        "_events": {
          "inview>timeout(500) .component-widget": [
            "- .fadeIn.dur-4 .component-widget",
            "+ .fadeIn.dur-4 .component-widget",
            "- .times-infinite.shake.dur-4 '.accordion-item a.accordion-item-title'",
            "+(>$i*250) .times-infinite.shake.dur-4 '.accordion-item a.accordion-item-title'"
          ]
        }
      }
    ]
  }
}
```

-- or to separate the animations from the components --

To go in components.json  
```
{
  "_animate": {
    "_isEnabled": true
  }
}
```

To go in course.json
```
{
  "_animate": {
    "_animations": [
      {
        "_id": "accordion-fadeIn-shake-items",
        "_components": [
          {
            "_component": "accordion"
          }
        ],
        "_events": {
          "inview>timeout(500) .component-widget": [
            "- .fadeIn.dur-4 .component-widget",
            "+ .fadeIn.dur-4 .component-widget",
            "- .times-infinite.shake.dur-4 '.accordion-item a.accordion-item-title'",
            "+(>$i*250) .times-infinite.shake.dur-4 '.accordion-item a.accordion-item-title'"
          ]
        }
      }
    ]
  }
}
```

###Example - ClickStyle
  
On elements with class 'clickstyle' on each click change to 'clickstyle-1', 'clickstyle-2' etc...  
  
```
 {
    "_id": "clickstyle",
    "_events": {
        "!click .clickstyle" : [
            "+ .clickstyle-$ge[data-clickstyle='$ge'] .clickstyle",
            "- .clickstyle .clickstyle"
        ],
        "!click [data-clickstyle]" : [
            "- .clickstyle-$lge [data-clickstyle]",
            "+ .clickstyle-$ge[data-clickstyle='$ge'] [data-clickstyle]"
        ]
    },
    "_global": true
}
```
  
###Example - Title Zoom In

When titles come into view by at least 50%, paly a 5 second zoomin animate once
```
{
    "_id": "title-in",
    "_isEnabled" : true,
    "_events": {
        "!inview(50) h6" : [
            "- .times-1.zoomInLeft.dur-5",
            "+ .times-1.zoomInLeft.dur-5"
        ],
        "!outview h6" :[
            "- .times-1.zoomInLeft.dur-5"
        ],
        "!inview(50) h5" : [
            "- .times-1.zoomInLeft.dur-5",
            "+ .times-1.zoomInLeft.dur-5"
        ],
        "!outview h5" :[
            "- .times-1.zoomInLeft.dur-5"
        ],
        "!inview(50) h4" : [
            "- .times-1.zoomInLeft.dur-5",
            "+ .times-1.zoomInLeft.dur-5"
        ],
        "!outview h4" :[
            "- .times-1.zoomInLeft.dur-5"
        ],
        "!inview(50) h3" : [
            "- .times-1.zoomInLeft.dur-5",
            "+ .times-1.zoomInLeft.dur-5"
        ],
        "!outview h3" :[
            "- .times-1.zoomInLeft.dur-5"
        ],
        "!inview(50) h2" : [
            "- .times-1.zoomInLeft.dur-5",
            "+ .times-1.zoomInLeft.dur-5"
        ],
        "!outview h2" :[
            "- .times-1.zoomInLeft.dur-5"
        ],
        "!inview(50) h1" : [
            "- .times-1.zoomInLeft.dur-5",
            "+ .times-1.zoomInLeft.dur-5"
        ],
        "!outview h1" :[
            "- .times-1.zoomInLeft.dur-5"
        ]
    },
    "_contentObjects": [
        {
            "_type": "page"
        }
    ]
}
```
  
  
###Included CSS3 Animation Classes (from https://github.com/daneden/animate.css)
  
Note: You may use your own styles!
  
```
  .animated
  .animated.infinite
  .animated.hinge
  .bounce
  .flash
  .pulse
  .rubberBand
  .shake
  .swing
  .tada
  .wobble
  .bounceIn
  .bounceInDown
  .bounceInLeft
  .bounceInRight
  .bounceInUp
  .bounceOut
  .bounceOutDown
  .bounceOutUp
  .fadeIn
  .fadeInDown
  .fadeInDownBig
  .fadeInLeft
  .fadeInLeftBig
  .fadeInRight
  .fadeInRightBig
  .fadeInUp
  .fadeInUpBig
  .fadeOut
  .fadeOutDown
  .fadeOutDownBig
  .fadeOutLeft
  .fadeOutLeftBig
  .fadeOutRight
  .fadeOutRightBig
  .fadeOutUp
  .fadeOutUpBig
  .flip
  .flipInX
  .flipInY
  .flipOutX
  .flipOutY
  .lightSpeedIn
  .lightSpeedOut
  .rotateIn
  .rotateInDownLeft
  .rotateInDownRight
  .rotateInUpLeft
  .rotateInUpRight
  .rotateOut
  .rotateOutDownLeft
  .rotateOutDownRight
  .rotateOutUpLeft
  .rotateOutUpRight
  .hinge
  .rollIn
  .rollOut
  .zoomIn
  .zoomInDown
  .zoomInLeft
  .zoomInRight
  .zoomInUp
  .zoomOut
  .zoomOutDown
  .zoomOutLeft
  .zoomOutRight
  .zoomOutUp
  
  For control there are also:  
  
  .dur-1  > .dur-20   animation duration @250 millisecond intervals (250 > 5000)  
  .del-1  > .del-20   animation delay @250 millisecond intervals (250 > 5000)  
  .times-1  > .times-20   animation iterations 1-20 times  
  .times-infinite  

```  

### Formation
  
"events onSelector": "[action] alterationSelector [toSelector]"  
    
####1 . events  

Description: Specifies the events to be applied to the toSelector elements  

[mode]eventName[>[mode]eventName][>[mode]eventName]....  

Can chain events together (see examples)

At the end of the event chain it is possible to loop round (see eventName for details)
    
###### mode  

Description: Specifies whether to call the event once or repeatedly  

     
1 = use $.one instead of $on to attach event  
! = use $.live instead of $on to attach event  
    
###### eventName

Description: Specifies the event name to be applied and occasionally with some event restriction parameters  
        
click, mouseover, mouseup, keypress, keyup etc... - name of standard jQuery events  

inview(percentageInview), outview, scroll, interval(milliseconds), timeout(milliseconds) - additionally  

Examples:  

```
"inview('50%')>timeout(500) .className" : ... == when the .className items are at least 50% inview, apply the alterations after 500 milliseconds  
"inview('50%')>1interval(500) .className" : ... == "inview('50%')>timeout(500) .className"  
"!click .clickable" : ... == when click on any current or new .clickable item, apply the alterations  
```
  
Chain Loop: 

An event name beginning with < will reapply the event at the index specified.  

```
1inview>1interval(500)><0  
```

Will activate on first inview after 500 milliseconds then reapply 1inview  
        
#### 2. onSelector/toSelector 

Description: Selects elements to attach event on or to apply alterations to  

[']jQuerySelector[']  

Example:  

```    
\#id.className = selects elements with id="id" and class="className"  
```

See [jquery selectors](http://api.jquery.com/category/selectors/)  
    
#### 3. action  

Description: Specifies the actions to be taken on the event call  
    
[manipulation][([order][intervalExpression])]  

###### manipulation

Description: Specifies whether to add or remove the alterations  

  \+ = add alterationSelector to toSelector  
  \- = remove alterationSelector from toSelector  
  
###### order

Description: Specifies the order at which the alterations are to be made on the elements from toSelector, top-to-bottom or bottom-to-top  

  \> = add interval descending  
  \< = add interval ascending  
  
###### intervalExpression

Description: Adds/removes alterationSelector to toSelector elements after specified interval  
Note: This expression is contextSubstituted before it is evaluated  (see below)  

Examples:  
  
```
500 = 500  
4*500 = 2000  
$i*250 = 0 for item 1, (250 for item 2, 500 for item 3 etc...  
```

#### 4. alterationSelector

Description: Specifies classes/attributes/content to change in toSelector elements  
Note: This expression is contextSubstituted before it is evaluated  (see below)  
    
[']contextSubsitutedEmmetSelector[']  

See [emmet.io cheat sheet](http://docs.emmet.io/cheat-sheet/)  
 
``` 
.item-$i = adds/removes classname item-0 for item 1, classname item-1 for item 2, etc...  
.clicks-$x = adds/remove classname clicks-1 on first click, classname clicks-2 on second click, etc...  
```


#### 5. contextSubsituted

Description: Allows intervalExpression and alterationSelector to use a few contextual variables  

```
$i = item order index  
$ni = natural item index  
$e = event fired count  
$le = last event fired count (fired count - 1)  
$ne = next event fired count (fired count + 1)  
$x = action fired count  
$lx = last action fired count (fired count - 1)  
$nx = next action fired count (fired count + 1)  
$ge = event name fired count  
$lge = last event name fired count (fired count - 1)  
$nge = next event name fired count (fired count + 1)  
$gs = event selector fired count  
$lgs = last event selector fired count (fired count - 1)  
$ngs = next event selector fired count (fired count + 1)  
$t = item top window offset
$r = item right window offset (from item right)  
$b = item bottom window offset (from item bottom)  
$l = item left window offset  
$t% = item top window offset percentage 0-100  
$r% = item right window offset percentage 0-100 (from item right)  
$b% = item bottom window offset percentage 0-100 (from item bottom)  
$l% = item left window offset percentage 0-100  
$t%d = item top window offset percentage decimal 0-1  
$r%d = item right window offset percentage decimal 0-1 (from item right)  
$b%d = item bottom window offset percentage decimal 0-1 (from item bottom)  
$l%d = item left window offset percentage decimal 0-1  
$iv% = inview percentage 0-100 (how much of the object is shown against the maximum possible)  
$iv%d = inview percentage decimal 0-1 (how much of the object is shown against the maximum possible)  

$e = is count for fires on single event line  
$x = is count for fires on single event line actions  
$ge = is count for fires on multiple event lines with the same event definition  
$gs = is count for fires on multiple event lines with the same selector definition  
```

###External Libraries
  
  [Animate.css](https://github.com/daneden/animate.css)  
  [Emmet.io](https://github.com/emmetio/textarea)  
  
