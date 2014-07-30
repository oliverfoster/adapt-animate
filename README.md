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

500 milliseconds after first inview > fade in accordion for 1 second and start shaking each item for 1 second, infinitely, in-turn, decending at intervals of 250 milliseconds.
```
{
  "_animate": {
    "_isEnabled": true,
    "_animations": [
      {
        "_id": "accordion-fadeIn-shake-items",
        "_events": {
          "!inview>timeout(500) .component-widget": [
            "+ .animated.fadeIn.duration-4 .component-widget",
            "+(>$i*250) .animated.infinite.shake.duration-4 '.component-item a.comoponent-item-title'"
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
          "!inview>timeout(500) .component-widget": [
            "+ .animated.fadeIn.duration-4 .component-widget",
            "+(>$i*250) .animated.infinite.shake.duration-4 '.component-item a.comoponent-item-title'"
          ]
        }
      }
    ]
  }
}
```


###Included CSS3 Animation Classes (from https://github.com/daneden/animate.css)

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
```  

### Formation
  
"events onSelector": "[action] alterationSelector [toSelector]"  
    
####1 . events  

Description: Specifies the events to be applied to the toSelector elements  

[mode]eventName[>[mode]eventName][>[mode]eventName]....  

Can chain events together (see examples)
    
###### mode  

Description: Specifies whether to call the event once or repeatedly  
       
! = use $.one instead of $on to attach event  
    
###### eventName

Description: Specifies the event name to be applied and occasionally some event parameters  
        
click, mouseover, mouseup, keypress, keyup etc... - name of standard jQuery events  

inview, outview, timeout(milliseconds), interval(milliseconds) - additionally  
        
#### 2. onSelector/toSelector 

Description: Selects elements to attach event on or to apply alterations to  

[']jQuerySelector[']  
    
Example:  
    
\#id.className = selects elements with id="id" class="className"  

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
  
500 = 500  
4*500 = 2000  
$i*250 = 0 for item 1, (250 for item 2, 500 for item 3 etc...  


#### 4. alterationSelector

Description: Specifies classes/attributes/content to change in toSelector elements  
Note: This expression is contextSubstituted before it is evaluated  (see below)  
    
[']contextSubsitutedEmmetSelector[']  

See [emmet.io cheat sheet](http://docs.emmet.io/cheat-sheet/)  
  
.item-$i = adds/removes classname item-0 for item 1, classname item-1 for item 2, etc...  
.clicks-$x = adds/remove classname clicks-1 on first click, classname clicks-2 on second click, etc...  



#### 5. contextSubsituted

Description: Allows intervalExpression and alterationSelector to use a few contextual variables  

$i = replaced by item index  
$ni = replaced by natural item index  
$x = replaced by event fired count  
$px = replaced by last event fired count  



###External Libraries
  
  [Animate.css](https://github.com/daneden/animate.css)  
  [Emmet.io](https://github.com/emmetio/textarea)  
  
