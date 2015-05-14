$(function() {
	// Particle time

	var canvas = document.getElementById('canvas');
	if (canvas) var ctx = canvas.getContext('2d');
	var physics = new Physics(0);
	var mouseEnabled = false;

	Number.prototype.toRads = function() {
		return this * Math.PI / 180;
	}

	Number.prototype.getSign = function() {
		return this <= 0 ? -1 : 1;
	}

	if (mouseEnabled) {
		var mouseParticle = physics.makeParticle(100, 0, 0);
		mouseParticle.makeFixed();

		$(window).on('mousemove', function(e) {
			mouseParticle.position.x = (e.clientX - $(canvas).offset().left);
			mouseParticle.position.y = (e.clientY - $(canvas).offset().top);
		});
	}

	var centerVector = new Physics.Vector(280, 280);


	var Polygon = function() {
		this.sign = (Math.random() - Math.random()).getSign();
		this.startX = this.sign === -1 ? 180 : 460;
		this.startY = this.sign === -1 ? 320 : 320;
		this.shape = Math.random() > 0.5 ? 'square' : 'cicle';
		this.rotation = Math.random() * 360;
		this.rotationDirection = Math.random() > 0.5 ? -1 : 1;
		var randCol = randomColor({
			hue: 'yellow',
			format: 'rgbArray'
		});

		this.color = {
			r: randCol[0],
			g: randCol[1],
			b: randCol[2]
		}

		this.added = false;
		this.inVision = true;

		this.vel = 0;
		this.targetVel = 10;

		this.size = 0;
		this.targetSize = Math.random() * 6;

		this.alpha = 0;
		this.targetAlpha = Math.random();
		this.initialTargetAlpha = this.targetAlpha;

		this.mass = this.targetSize / 4 + 1;

		// Only if it should cicle arund something
		this.anchor = physics.makeParticle(1, 0, 0);
		this.anchor.reset();
		this.anchor.position.x = centerVector.x;
		this.anchor.position.y = centerVector.y;
		this.anchor.makeFixed();

		this._draw = function() {
			//ctx.fillStyle = 'rgba(243, 215, 127, ' + this.alpha + ')';
			ctx.fillStyle = 'rgba(' + this.color.r + ', ' + this.color.g + ', ' + this.color.b + ', ' + this.alpha + ')';
			ctx.save();
			ctx.beginPath();
			ctx.translate(this.particle.position.x, this.particle.position.y);
			if (this.shape === 'square') {
				ctx.rotate(this.rotation.toRads());
				ctx.rect(
					-this.size / 2,
					-this.size / 2,
					this.size,
					this.size
				);
			} else {
				ctx.ellipse(
					-this.size / 4,
					-this.size / 4,
					this.size / 2,
					this.size / 2,
					0, 0, 2 * Math.PI
				);
			}
			ctx.fill();
			ctx.restore();
		}

		Polygon.all.push(this);
	}

	Polygon.all = [];

	Polygon.prototype.add = function() {
		this.alpha = 0;
		this.size = 0;
		this.vel = 0;
		this.rotation = 0;

		if (!this.added) this.particle = physics.makeParticle(this.mass, 0, 0);
		this.particle.position.x = this.startX;
		this.particle.position.y = this.startY;

		var velX = (Math.random() - Math.random()) * this.targetVel;
		var velY = Math.random() * this.targetVel * this.sign;

		this.particle.velocity.x = 0;
		this.particle.velocity.y = velY;
		this.added = true;
		this.spring = physics.makeSpring(this.anchor, this.particle, 0.0002, 0.03, 20);
		if (mouseEnabled) this.repel = physics.makeAttraction(this.particle, mouseParticle, -1, 20);
	}

	Polygon.prototype.update = function() {
		if (!this.added) {
			this.add();
		}

		this.alpha += (this.targetAlpha - this.alpha) * 0.1;
		this.size += (this.targetSize - this.size) * 0.1;
		var distance = this.particle.position.distanceToSquared(centerVector);
		if (distance > 62500 || distance < 10000) {
			this.targetAlpha = 0;
		} else {
			this.targetAlpha = this.initialTargetAlpha
		}

		var l = this.particle.velocity.lengthSquared();
		if (l > this.targetVel) {
			this.particle.velocity.scale(this.targetVel / l);
		}

		if (this.rotation > 360) this.rotation -= 360;
		this.rotation += 2 * this.rotationDirection;
	}

	Polygon.prototype.draw = function() {
		if (
			this.particle.position.x > $(document).width() + this.size
			|| this.particle.position.x < -this.size
			|| this.particle.position.y > $(document).height() + this.size
			|| this.particle.position.y < -this.size
			|| this.particle.position.distanceTo(centerVector) < 90
		) {
			this.add();
		} else {
			this._draw();
		}
	}

	// Change stuff on resizing

	var $window = $(window);

	function reScaleCanvas() {
		if (window.devicePixelRatio && canvas) {
			var canvasWidth = 640;
			var canvasHeight = 560;

			canvas.width = canvasWidth * window.devicePixelRatio;
			canvas.height = canvasHeight * window.devicePixelRatio;

			$('#canvas').css({
				width: canvasWidth,
				height: canvasHeight
			});

			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		}
	}

	$window.on('resize', function() {
		$('#pulse').css({
			height: $(document).height()
		});
		reScaleCanvas();
	});

	$window.resize();

	// Add particles and start simulation

	var addParticleInterval = setInterval(function() {
		if (!canvas) clearInterval(addParticleInterval);
		new Polygon();
		if (Polygon.all.length >= 300) {
			clearInterval(addParticleInterval);
		}
	}, 20); // 20 * 200 ==> 4s

	physics.play();

	function renderFrame() {
		if (canvas) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			Polygon.all.forEach(function(polygon) {
				polygon.update();
				polygon.draw();
			});
		}
		requestAnimationFrame(renderFrame);
	}
	renderFrame();

	// Hompage pulsating square

	function pulsate() {
		$('#pulse-outer').velocity({
			opacity: [0, 1],
			scale: [1, 0],
			rotateZ: [45, 45]
		}, {
			delay: 1000,
			duration: 2000,
			easing: easing.easeOutCubic // easeOutCubic
		});

		$('#pulse-inner').velocity({
			opacity: [0, 1],
			scale: [0.9, 0],
			rotateZ: [45, 45]
		}, {
			delay: 1300,
			duration: 2500,
			easing: easing.easeOutCubic,
			complete: pulsate
		});
	}

	if ($('#pulse')) pulsate();
});