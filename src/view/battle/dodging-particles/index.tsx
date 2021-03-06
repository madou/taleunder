import React from 'react';
import Canvas from '../../canvas';
import { BoundingBox } from '../types';
import { interpolate } from '../../../lib/interpolate';
import { limit } from '../../../lib/limit';

interface Particle {
  width: number;
  height: number;
  behaviour: 'bounce' | number[];
  start: [number, number];
  damage: number;
  speed: number;
  sprite?: string;
}

export interface ParticleUpdate {
  boundingBox: BoundingBox;
  damage: number;
}

interface DodgingParticlesProps {
  boundingBox: BoundingBox;
  particles: Particle[];
  onUpdate: (particles: ParticleUpdate[]) => void;
}

const calcInitialPositions = (particles: Particle[]): BoundingBox[] => {
  return particles.map<BoundingBox>(particle => {
    const [x, y] = particle.start;
    return [x, y, x + particle.width, y + particle.height];
  });
};

const combineBoundingBox = (b1: BoundingBox, b2: BoundingBox): BoundingBox => {
  const [x1, y1, x2, y2] = b1;
  const [x3, y3] = b2;

  const boundingBox: BoundingBox = [x1 + x3, y1 + y3, x2 + x3, y2 + y3];
  return boundingBox;
};

const moveParticle = (
  position: BoundingBox,
  direction: number,
  boundingBox: BoundingBox,
  particle: Particle
): BoundingBox => {
  const [x, y] = position;
  const { speed } = particle;
  const minimalBoundingBox = [
    0,
    0,
    boundingBox[2] - boundingBox[0],
    boundingBox[3] - boundingBox[1],
  ];
  const newX = limit(interpolate(x, x + speed, speed), [0, minimalBoundingBox[2] - particle.width]);
  const newY = limit(interpolate(y, y + speed, speed), [
    0,
    minimalBoundingBox[3] - particle.height,
  ]);

  return [newX, newY, newX + particle.width, newY + particle.height];
};

export default class DodgingParticles extends React.Component<DodgingParticlesProps> {
  canvasRef: Canvas | null = null;
  /**
   * The positions start from the inside of the bounding box, e.g. [0,0, 20, 20]
   * would map to [500,500, 520, 520] if bounding box was [500,500,1000,1000].
   * Make sure to map these appropriately. Anything being communicated should always
   * be done in the latter format.
   */
  particlePositions: BoundingBox[] = calcInitialPositions(this.props.particles);

  componentDidMount() {
    this.draw();
  }

  draw = () => {
    const canvas = this.canvasRef;
    if (!canvas || !canvas.canvasElement || !canvas.canvasContext) return;

    const ctx = canvas.canvasContext;
    if (ctx) {
      const { boundingBox, particles, onUpdate } = this.props;
      const [x1, y1] = boundingBox;

      ctx.fillStyle = 'white';
      ctx.clearRect(0, 0, canvas.canvasElement.width, canvas.canvasElement.height);

      particles.forEach((particle, index) => {
        this.particlePositions[index] = moveParticle(
          this.particlePositions[index],
          10,
          boundingBox,
          particle
        );
        const [newx, newy] = this.particlePositions[index];

        ctx.fillRect(x1 + newx, y1 + newy, particle.width, particle.height);
      });

      onUpdate(
        this.particlePositions.map((position, index) => ({
          boundingBox: combineBoundingBox(position, boundingBox),
          damage: particles[index].damage,
        }))
      );
      requestAnimationFrame(this.draw);
    }
  };

  setRef = (ref: Canvas | null) => {
    this.canvasRef = ref;
  };

  render() {
    return <Canvas ref={this.setRef} />;
  }
}
