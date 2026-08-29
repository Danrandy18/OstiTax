import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Marca "NK" con anillo que se dibuja y aparición con resorte.
/// Reemplaza al típico spinner de splash por algo con intención de marca.
class AnimatedLogo extends StatefulWidget {
  const AnimatedLogo({super.key, this.size = 84});

  final double size;

  @override
  State<AnimatedLogo> createState() => _AnimatedLogoState();
}

class _AnimatedLogoState extends State<AnimatedLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _ringProgress;
  late final Animation<double> _scale;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );
    _ringProgress = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0, 0.7, curve: Curves.easeOutCubic),
    );
    _scale = Tween<double>(begin: 0.82, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.25, 1, curve: Curves.easeOutBack),
      ),
    );
    _fade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0, 0.4, curve: Curves.easeOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Opacity(
          opacity: _fade.value,
          child: Transform.scale(
            scale: _scale.value,
            child: SizedBox(
              width: widget.size,
              height: widget.size,
              child: CustomPaint(
                painter: _LogoRingPainter(progress: _ringProgress.value),
                child: Center(
                  child: Text(
                    'NK',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: widget.size * 0.32,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _LogoRingPainter extends CustomPainter {
  _LogoRingPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final radius = size.width * 0.24;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));

    final fillPaint = Paint()..color = AppColors.primary;
    canvas.drawRRect(rrect, fillPaint);

    final ringPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.045
      ..strokeCap = StrokeCap.round;

    final ringRect = rect.deflate(size.width * 0.06);
    const startAngle = -1.5708; // -90deg
    final sweep = progress * 6.2832;
    canvas.drawArc(ringRect, startAngle, sweep, false, ringPaint);
  }

  @override
  bool shouldRepaint(covariant _LogoRingPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
