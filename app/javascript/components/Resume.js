import React from 'react';
import NavigationOverlay from './NavigationOverlay';

const Resume = props => {
  return (
    <div id="resume-container">
      <h1>You Should Hire Me</h1>
      <p className='resume'>I'm an experienced software developer with a wealth of experience in complex, compliance-heavy domains (specifically, healthcare and financial data verification). I first got started as a technologist by developing IRL puzzle game props, and I still have a particular focus on building systems that are intuitive and joyful to use.</p>
      <p className='resume'>I'm open to work in the gaming space, but also in any other field with a focus on building digital products that customers will love.</p>
      <p className='resume'>Email me at <a href="mailto:leon@lionspawgames.com">leon@lionspawgames.com</a> if you want to chat!</p>

      <h2 className='resume'>2023</h2>
      <h3 className='resume'>Lion's Paw Games - Founder</h3>
      <p className='resume'>Frustrated by the present job market, I gave myself some space to build something I would love.</p>
      <ul>
        <li>
          <h4 className='resume'>Into the Dreamlands</h4>
          <p className='resume'>My literal "dream game": a retro RPG in the idiom of early 2000s Game Boy and GBA games like Golden Sun or early Pokemon entries. Mix and match body parts from defeated foes to create a unique "dreamform". Battle through terrifying nightmares and surreal environments to protect the Dreamlands and the waking world alike.</p>
        </li>
        <li>
          <h4 className='resume'>Temple of Terror</h4>
          <p className='resume'>A sweet and simple semi-random dungeon crawler riffing on the Forged in the Dark game system. Choose the right actions to overcome each obstacle in the Temple, collect Treasure, and endure Sufferings inflicted by ancient traps and guardians.</p>
        </li>
      </ul>
      <h2 className='resume'>2022</h2>
      <h3 className='resume'>Hummingbird RegTech - Software Engineer</h3>
      <p className='resume'>Fresh out of the mega-corporate world of Amazon, I decided to explore the world of smaller companies. Hummingbird provides a software suite (centered on a Ruby on Rails app) for professional investigators and auditors in the finance industry.</p>
      <p className='resume'>Stack: Google Cloud, Ruby on Rails, GraphQL, JavaScript/TypeScript, React</p>
      <ul>
        <li>
          <p className='resume'>Built new data visualization features for fraud cases, emphasizing points of commonality in large data sets of credit cards, bank account info, etc. The sales team loved the feature set and said it helped sell the product to multiple enterprise customers.</p>
        </li>
        <li>
          <p className='resume'>Improved data export process: wrote new feature to allow specific subsets of fraud case data to be quickly and reliably saved to portable formats, eliminating a customer workflow where large volumes of content had to be manually copy/pasted out of the app.</p>
        </li>
      </ul>
      <h2 className='resume'>2018 - 2022</h2>
      <h3 className='resume'>Amazon - Software Engineer</h3>
      <p className='resume'>My first "real" software industry role. I joined Amazon about a month after the acquisition of PillPack (now Amazon Pharmacy), and participated in the build-out of that organization to Amazon scale for almost four years, learning a whole lot of AWS architecture and large-scale engineering principles along the way.</p>
      <p className='resume'>PillPack operated with a single Ruby on Rails monolith powering all customer interactions and pharmacy floor prodution processes. I helped decompose this system into a scalable cloud-native microservice ecosystem.</p>
      <p className='resume'>Stack: AWS, Ruby on Rails, AWS Lambda, APIGateway, S3, DynamoDB, Java, Go, JavaScript, React</p>
      <ul>
        <li>
          <p className='resume'>Re-designed software (Ruby) for generating “customer literature” PDFs consisting of health-critical prescription information, warnings, and all other documentation in compliance with pharmacy regulations. Added support for non-Latin-character-based languages and regional documentation necessary to operate at scale, as well as cutting document generation time from minutes to seconds.</p>
        </li>
        <li>
          <p className='resume'>Migrated critical drug catalog and inventory data to a new, scalable model while maintaining compatibility with existing operational processes.</p>
        </li>
        <li>
          <p className='resume'>Built software (Java, React, AWSLambda)  to support a new workflow for verifying on-hand inventory on a rolling basis in compliance with FDA regulations. Led a full-stack design with one-and-a-half other engineers.</p>
        </li>
      </ul>
      <h2 className='resume'>2016-2018</h2>
      <h3 className='resume'>Portland Escape Rooms - Puzzle Electronics Designer</h3>
      <p className='resume'>My start in writing code professionally! I carved out this role for myself at a small business in Portland, OR.</p>
      <p className='resume'>Stack: C++, Arduino, ESP8266, Raspberry Pi, MQTT (MosQuiTTo), physical components (lithium batteries, sensors, RFID, electromagnets, LEDs, servos)</p>
      <ul>
        <li>
          <h4 className='resume'>Madame Neptune's Voodoo Curse</h4>
          <p className='resume'>My first prop project. Works like a charm to this day!</p>
          <ul>
            <li>
              <p className='resume'>Cursed Top Hat: decorated top hat with a secret button to control lighting effects on the LED strip hidden in the hatband.</p>
            </li>
          </ul>
          <h4 className='resume'>American Revolution</h4>
          <p className='resume'>First chance I had to give input on puzzle design. Developed a MQTT-based pub-sub technique for reliable local wireless communication between ESP8266 chips.</p>
          <ul>
            <li>
              <p className='resume'>Paul Revere puzzle: series of switches controlling the on/off state of three "lantern" lightbulbs. Correctly setting the lantern light combination triggered a separate "birdhouse" prop to open a trapdoor in the bottom and drop a key.</p>
            </li>
            <li>
              <p className='resume'>Ship Chart puzzle: pegboard with model ships. Model ships contin RFID tags: puzzle involves first placing the ships in designated positions, then moving each ship to a correct subsequent position in the correct order. RFID sensors embedded under the table surface provided input, and a trapdoor beneath the table played a sound effect and dropped a key on successfull completion.</p>
            </li>
            <li>
              <p className='resume'>Cannonball puzzle: simple conductivity sensor hidden in the "bottom" of a model cannon, triggering a solved-puzzle interaction when a steel cannonball was dropped into the barrel.</p>
            </li>
          </ul>
          <h4 className='resume'>Steampunk Airship</h4>
          <p className='resume'>Complex, semi-randomized puzzle design building on the MQTT tech developed for American Rev.</p>
          <ul>
            <li>
              <p className='resume'>Command Deck: Multi-part puzzle involving a large central physical console and "readouts"/"instruments" scattered throughout the installation.</p>
            </li>
            <li>
              <p className='resume'>Command Deck Readouts: "Engine feedback" panel based on matching sounds (stored as .wav files), "Navigation" panel based on traversing a grid with a joystick, "Sigil Reinforcement" panel based on correctly tracing a pattern on a series of nodes painted in conductive ink, "Encryption" panel based on decoding a simple keyword cipher.</p>
            </li>
          </ul>
        </li>
      </ul>
      <NavigationOverlay/>
    </div>
  )
};

export default Resume;