adapt-animate
=============

Events to classes on pages/articles/blocks/components (using jquery and emmet style css selectors)

#Uses
  
  https://github.com/daneden/animate.css
  https://github.com/emmetio/textarea
  
#Usage
  
To go in contentObjects.json/articles.json/blocks.json/components.json
  
#Example - Accordion fadeIn and shake items
  
500 milliseconds after first inview, fade in accordion for 1 second and start shaking each item infinitely, in-tern, decending, at intervals of 250 milliseconds after each other.
'''
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
          "!inview>timeout(500) .component-widget": [
            "+(>$i*250) .animated.infinite.shake.duration-4 '.component-item a.comoponent-item-title'",
            "+ .animated.fadeIn.duration-4 .component-widget"
          ]
        ]
    
    ]
  }
}
'''

#Included CSS3 Animation Classes - https://github.com/daneden/animate.css
  
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
  
  
 



On Component
