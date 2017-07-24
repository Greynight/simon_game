const Button = (props) => {
  const color = props.state ? 'green' : 'red';

  return (
    <div className="button-round" style={{backgroundColor: color}}></div>
  );
};

const GameOnOff = (props) => {
  const onClass = props.state ? "btn btn-success btn-sm disabled" : "btn btn-success btn-sm";
  const offClass = props.state ? "btn btn-danger btn-sm" : "btn btn-danger btn-sm disabled";

  return (
    <div className="btn-group" role="group">
      <button type="button" className={ onClass }>ON</button>
      <button type="button" className={ offClass }>OFF</button>
    </div>
  );
};

class SimonGame extends React.Component {
  constructor(props) {
    super(props);

    this.sectors = ['blue', 'yellow', 'green', 'red'];

    this.state = {
      on: false,
      strict: false,
      started: false,
      count: 0,
      sequence: [],
      userSequence: [],
      highlighted: false
    };

    this.audio = this.initAudio();
  }

  initAudio = () => {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;

      let audioContext = new AudioContext();
      let sectorSounds = {};

      const sounds = ['red', 'blue', 'green', 'yellow'];
      const frequencies = [329.63, 261.63, 220, 164.81];

      let errOsc = audioContext.createOscillator();
      errOsc.type = 'triangle';
      errOsc.frequency.value = 110;
      errOsc.start(0.0);

      let errNode = audioContext.createGain();
      errOsc.connect(errNode);
      errNode.gain.value = 0;
      errNode.connect(audioContext.destination);

      const ramp = 0.05;
      const vol = 0.5;

      let oscillators = frequencies.map((frq) => {
        let osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frq;
        osc.start(0.0);

        return osc;
      });

      let gainNodes = oscillators.map((osc) => {
        let g = audioContext.createGain();
        osc.connect(g);
        g.connect(audioContext.destination);
        g.gain.value = 0;

        return g;
      });

      function playErrTone() {
        errNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
      }

      function stopErrTone() {
        errNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
      }

      function playGoodTone(sector) {
        sectorSounds[sector].gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
      }

      function stopGoodTones() {
        for (let sound of sounds) {
          sectorSounds[sound].gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
        }
      }

      const soundsCount = sounds.length;

      for (let i = 0; i < soundsCount; i++) {
        sectorSounds[sounds[i]] = gainNodes[i];
      }

      return {
        playErrTone,
        stopErrTone,
        playGoodTone,
        stopGoodTones
      };
    }
    catch(e) {
      alert('Web Audio API is not supported in this browser');
    }
  };

  generateStep = () => {
    const sectorIndex = Math.round(Math.random() * 3);
    return this.sectors[sectorIndex];
  };

  addStepToSequence = () => {
    this.setState({
      sequence: this.state.sequence.push(this.generateStep())
    });
  };
  
  playOneStep = (sector) => {
    this.audio.playGoodTone(sector);
    this.setState(
      highlighted: sector
    );
    
    setTimeout(() => {
      this.audio.stopGoodTones(sector);
      this.setState(
        highlighted: false
      );
    }, 3000);
  };
  
  playSequence = () => {
    for (let sector of this.state.sequence) {
      this.playOneStep(sector);
    }
  };

  checkStep = (sector) => {
    this.state.userSequence.push(sector);
    return this.state.sequence[this.state.userSequence.length - 1] === sector;
  };

  handleSectorClickStart = (e) =>  {
    const sector = e.target.id;

    if (this.checkStep(sector)) {
      this.audio.playGoodTone(sector);
    } else {
      this.audio.playErrTone();
    }
  };

  handleSectorClickStop = (e) => {
    const sector = e.target.id;

    if (this.checkStep(sector)) {
      // TODO all steps in current sequence were completed successfully
      // TODO if sequence length === 20, then the WIN
      this.audio.stopGoodTones(sector);

      if (this.state.sequence.length === this.state.userSequence.length) {
        this.state.userSequence.length = 0;
        this.addStepToSequence();
        this.playSequence();
      }
    } else {
      this.audio.stopErrTone();
      this.state.userSequence.length = 0;
      this.playSequence();
      // TODO stop playing sequence
      // TODO if not strict, then play from the beginning
    }
  };

  handleGameStart = () => {
    this.setState({
      started: !this.state.started
    });

    this.addStepToSequence();
    this.playSequence();
  };

  handleStrictChange = () => {
    this.setState({
      strict: !this.state.strict
    });
  };

  handleGameOn = () => {
    this.setState({
      on: !this.state.on
    });
  };

  render() {
    return (
      <div className="container-fluid">
        <div className="row" style={{ height: 100 }}></div>
        <div className="row">
          <div className="col-4"></div>
          <div className="col-4 text-center">
            <div id="circle">
              <div 
                id="red" 
                className={this.state.highlighted === 'red' ? 'light' : ''} 
                onMouseDown={this.handleSectorClickStart} 
                onMouseUp={this.handleSectorClickStop}>
              </div>
              <div 
                id="green"
                className={this.state.highlighted === 'green' ? 'light' : ''}
                onMouseDown={this.handleSectorClickStart} 
                onMouseUp={this.handleSectorClickStop}>
              </div>
              <div 
                id="yellow"
                className={this.state.highlighted === 'yellow' ? 'light' : ''}
                onMouseDown={this.handleSectorClickStart} 
                onMouseUp={this.handleSectorClickStop}>
              </div>
              <div
                id="blue"
                onMouseDown={this.handleSectorClickStart}
                onMouseUp={this.handleSectorClickStop}>
                className={this.state.highlighted === 'blue' ? 'light' : ''}
              </div>
              <div id="inner-circle" className="text-center">
                <Button state={this.state.started} />
                <span onClick={this.handleGameStart}>
                  {this.state.started ? <a href="#">Stop</a> : <a href="#">Start</a>}
                </span>
                <br />
                <Button state={this.state.strict} />
                <span onClick={this.handleStrictChange}>
                  {this.state.strict ? <a href="#">Strict OFF</a> : <a href="#">Strict ON</a>}
                </span>
                <br />
                <span onClick={this.handleGameOn}>
                  <GameOnOff state={ this.state.on } />
                </span>
                <br />
                <br />
                <div id="counter">
                  { this.state.on ? this.state.count : '' }
                </div>
              </div>
            </div>
          </div>
          <div className="col-4"></div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <SimonGame />,
  document.getElementById('root')
);
