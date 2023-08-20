Affinity defaults:

SKY
  * Heron Head
  * Angelic Robes
  * Glass Wing
  * Glass Wing
  * Tentacle
  * Tentacle

EARTH
  * Horned Skull
  * Stone Trunk
  * Beast Claw
  * Beast Claw
  * Beast Claw
  * Beast Claw

MOUNTAIN
  * Iron Visage
  * Armor Plate
  * Sword Arm
  * Shield Arm
  * Goat Leg
  * Goat Leg

MARSH
  * Mosquito Head
  * Rotting Ribcage
  * Mantis Arm
  * Mantis Arm
  * Tentacle
  * Tentacle

FIRE
  * Salamander Head
  * Scaly Torso
  * Leathery Wing
  * Leathery Wing
  * Goat Leg
  * Goat Leg

WATER
  * Enormous Eye
  * Scaly Torso
  * Tentacle
  * Tentacle
  * Tentacle
  * Tentacle

WIND
  * Horned Skull
  * Rotting Ribcage
  * Leathery Wing
  * Leathery Wing
  * Fierce Talon
  * Fierce Talon

THUNDER
  * Heron Head
  * Serpent Coils
  * Feathery Wing
  * Feathery Wing
  * Spark Claw
  * Spark Claw

EARTH
  MOUNTAIN
FIRE
  THUNDER
WIND
  SKY
WATER
  MARSH

  OK, I hate to say it but I think we will probably want to go with the more complex solution of adding a ArenaPlayerBodyPart model for state that is specific to an individual instance of a body part: we will definitely need state like that for our battle system, but since this is a game we will also want to be able to change the behavior of body parts for balance reasons without having to update every extant instance of a part individually.

That all seems directionally correct! I think my next step will be wiring up the beginnings of a front-end, so we can make some decisions about data flow and how the browser client will work. Before we add any actual gameplay elements to the BPs (like related Techniques), let's add an art asset for each one so we can display a nice UI of all a player's equipped BPs.

Fortunately, I already have PNG art assets ready to go. What would be the most conventional way to store these PNGs on the server and bind them to appropriate Body Part rows?