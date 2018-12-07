from math import cos, pi, sin

from rainbow_controller.displays.logo.constants import INNER_CCW, OUTER_CCW

SQUARE = 200


def ring(r, offset, indices):
    indices = list(indices)
    steps = len(indices)
    theta = offset
    step = 2 * pi / steps
    for index in indices:
        x = r * sin(theta) + SQUARE / 2
        y = -r * cos(theta) + SQUARE / 2
        theta += step
        print(
            f'  <circle cx="{x:.0f}" cy="{y:.0f}" r="5" id="led{index}" stroke="black" strokeWidth="1" fill={{`rgb(${{pixels[{index}]}})`}}/>'
        )


print('<svg height="200" width="200">')
ring(75, 0, reversed(OUTER_CCW))
ring(60, 2 * pi / 360 * 5, reversed(INNER_CCW))
print("</svg>")
