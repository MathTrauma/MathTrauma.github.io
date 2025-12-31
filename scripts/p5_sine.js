// import p5 from 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js';


export function createP5Sine(sketchParent) {
    return new p5((p) => {
        let t = 0;
        const R = 60;
        const graphLen = 240;

        p.setup = () => {
            p.createCanvas(512, 256);
            p.pixelDensity(1);
            p.background(255);
        };

        p.draw = () => {
            p.background(255);

            p.translate(80, p.height / 2);

            // 단위원
            p.noFill();
            p.stroke(0);
            p.circle(0, 0, R * 2);

            // 회전 점
            const x = R * p.cos(t);
            const y = R * p.sin(t);

            p.fill(0);
            p.circle(x, y, 6);

            // 펼쳐진 sine 그래프
            p.translate(100, 0);
            p.line(-100, y, 0, y);

            p.noFill();
            p.beginShape();
            for (let i = 0; i < graphLen; i++) {
                const tt = t - i * 0.05;
                p.vertex(i, R * p.sin(tt));
            }
            p.endShape();

            t += 0.03;
        };
    }, sketchParent);
}
