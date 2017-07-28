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
    this.sequence = [];
    this.userSequence = [];
    this.isPlaying = false;

    this.state = {
      on: false,
      strict: false,
      started: false,
      count: 0,
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

  updateCounter = () => {
    this.setState({
      count: this.sequence.length
    });
  };

  generateStep = () => {
    const sectorIndex = Math.round(Math.random() * 3);
    return this.sectors[sectorIndex];
  };

  addStepToSequence = () => {
    this.sequence.push(this.generateStep());
    this.updateCounter();
  };

  playOneStep = (sector) => {
    this.audio.playGoodTone(sector);
    this.setState({
      highlighted: sector
    });

    setTimeout(() => {
      this.audio.stopGoodTones(sector);
      this.setState({
        highlighted: false
      });
    }, 1000);
  };

  playSequence = () => {
    let delay = 0;
    this.isPlaying = true;

    for (let sector of this.sequence) {
      setTimeout(() => {
        this.playOneStep(sector);
      }, delay);

      delay += 1500;
    }

    delay -= 1000;

    setTimeout(() => {
      this.isPlaying = false;
    }, delay);
  };

  checkStep = (sector) => {
    console.log(this.sequence, this.userSequence);
    return this.sequence[this.userSequence.length - 1] === sector;
  };

  handleSectorClickStart = (e) =>  {
    if (this.isPlaying || !this.state.on || !this.state.started) {
      return false;
    }

    const sector = e.target.id;
    const userSequence = this.userSequence;

    userSequence.push(sector);

    this.setState({
      highlighted: sector
    });

    if (this.checkStep(sector)) {
      this.audio.playGoodTone(sector);
    } else {
      this.audio.playErrTone();
    }
  };

  handleSectorClickStop = (e) => {
    if (this.isPlaying || !this.state.on || !this.state.started) {
      return false;
    }

    const sector = e.target.id;

    if (this.checkStep(sector)) {
      this.audio.stopGoodTones(sector);

      this.setState({
        highlighted: false
      });

      if (this.sequence.length === this.userSequence.length) {
        if (this.userSequence.length === 20) {
          alert('You are the champion!');

          this.setState({
            started: false,
            on: false
          });

          return false;
        }

        this.addStepToSequence();
        this.userSequence.length = 0;

        setTimeout(() => {
          this.playSequence();
        }, 2000);
      }
    } else {
      this.audio.stopErrTone();

      this.setState({
        highlighted: false
      });

      if (this.state.strict) {
        this.userSequence.length = 0;
        this.sequence.length = 0;
        alert('Looser! Play from the beginning!');
        this.addStepToSequence();
        this.playSequence();
      } else {
        this.userSequence.length = 0;
        this.playSequence();
      }
    }
  };

  handleGameStart = () => {
    const wasStarted = this.state.started;

    this.setState({
      started: !this.state.started
    });

    if (!wasStarted) {
      this.addStepToSequence();
      this.playSequence();
    } else {
      this.userSequence.length = 0;
      this.sequence.length = 0;

      this.setState({
        count: 0
      });
    }
  };

  handleStrictChange = () => {
    this.setState({
      strict: !this.state.strict
    });
  };

  handleGameOn = () => {
    this.setState({
      on: !this.state.on,
      count: 0
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
                className={this.state.highlighted === 'blue' ? 'light' : ''}
                onMouseDown={this.handleSectorClickStart}
                onMouseUp={this.handleSectorClickStop}>
              </div>
              <div id="inner-circle" className="text-center">
                <div className="inner-elements">
                  <Button state={this.state.started} />
                  <span onClick={this.handleGameStart}>
                    {this.state.started ? <a href="#">Stop</a> : <a href="#">Start</a>}
                  </span>
                </div>
                <div className="inner-elements">
                  <Button state={this.state.strict} />
                  <span onClick={this.handleStrictChange}>
                    {this.state.strict ? <a href="#">Strict OFF</a> : <a href="#">Strict ON</a>}
                  </span>
                </div>
                <div className="inner-elements" onClick={this.handleGameOn}>
                  <GameOnOff state={ this.state.on } />
                </div>
                <div className="inner-elements" id="counter">
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
