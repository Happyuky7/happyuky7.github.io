This started out of boredom and got a bit out of hand. I wanted to see **Gargantua**, the black hole from *Interstellar*, moving in the browser. Not an image with a ring painted on top, but something actually computed with the physics of a spinning black hole.

The result is **Black Hole Web**. You can try it at [gargantua.happyuky7.com](https://gargantua.happyuky7.com), and the code is on [GitHub](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) (MIT).

> **Heads-up:** the website computes every pixel in real time, so it can make your device lag or heat up. It is best viewed on a PC or laptop with a graphics card. On phones it may stutter; if it does, set the quality to *Fast*.

This post isn't a programming tutorial. It's more what I learned along the way, explained as simply as I could: what a black hole is, why Gargantua looks the way it does, and how the website draws it.

![Gargantua in Cinema mode, with the film's camera](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## What is a black hole?

It's a region with so much mass packed together that spacetime curves to the point where nothing can get out, not even light. The edge of that region is called the **event horizon**: whatever crosses it doesn't come back.

There are two classic models:

- **Schwarzschild** (1916): a black hole that doesn't spin. It's the simplest case.
- **Kerr** (1963): a black hole that **spins**. This is the one that matters in real life, because almost everything in the universe spins, and it's also the one Gargantua is.

Spin changes a lot. The black hole drags spacetime around with it, and light passing on one side doesn't follow the same path as light passing on the other. That's why Gargantua's shadow isn't a perfect circle: it's slightly flattened on one side.

## Why does Gargantua look like that?

Around the black hole there's an **accretion disk**: gas spinning so fast and getting so hot that it glows. That disk is flat, like Saturn's rings. So why does the movie show one arc above and another below?

It's **gravitational lensing**. Light leaving the part of the disk *behind* the black hole doesn't travel in a straight line: gravity bends it over the top and under the bottom, and it reaches us. What looks like a "halo" above the shadow is actually the back of the disk.

Look closely and there's also a very thin **photon ring** hugging the shadow. That's light that went half a turn or more around the black hole before escaping.

None of this is painted on in the website. It all comes out of the equations.

## What the movie changed on purpose

The effects in *Interstellar* were made with advice from physicist **Kip Thorne**, and the team later published a scientific paper on how they computed them ([James et al., 2015](https://arxiv.org/abs/1502.03808)). But they made one big concession.

In a real black hole, the side of the disk coming **towards us** looks much brighter and bluer, and the side moving away looks dimmer and redder. That's the relativistic **Doppler effect**. The movie removed it, because a lopsided disk with odd colors would have confused the audience.

That's why the website has two ways to look at it:

- **Artistic modes**, which recreate the film's look: golden disk, no Doppler asymmetry, film grain and a 2.39:1 frame.
- **Scientific mode**, which turns all of that off and shows what a real camera would record.

## The five modes

The website comes with five presets. They all use the same light paths; what changes is the spin, the camera and how close it stays to the film.

**Interstellar.** The film's look: spin 0.6, golden disk with no Doppler, film grain and a 2.39:1 frame.

![Interstellar mode](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** The film's exact camera, far away from the black hole, with a black sky and distant stars. It's the image at the top of the post.

**Scientific.** Full physics: blackbody disk, exact Doppler and gravitational redshift. The side coming towards us is much brighter.

![Scientific mode](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Spin 0.94 with real Doppler, but with the movie-style disk. That is why one side is brighter than the other.

![Clean Kerr mode](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Almost maximum spin (0.998) and the camera almost in the plane of the disk: a thin, very bright band and very strong lensing.

![Edge-on mode](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## How the website draws it

The idea is called **backward ray tracing**. For every pixel on screen, the website shoots a ray of light from the camera *backwards* and follows it through curved spacetime. Three things can happen:

1. **It hits the disk**: the pixel takes the color of the gas at that point.
2. **It falls into the horizon**: the pixel stays black. That's how the shadow appears.
3. **It escapes**: the pixel shows the star it ends up pointing at. That's how the starfield gets warped.

All of this runs on the GPU, for every pixel, every frame. The path of the light is integrated step by step. There are two methods: *leapfrog*, which is faster, for the artistic modes, and **RK4**, which is about **7 times more accurate** with the same number of steps, for scientific mode.

## The temperature of the disk

In scientific mode, the disk's color isn't picked by hand. It comes from a physical model (Novikov–Thorne) that works out how hot the gas is from the black hole's **mass** and **how much material it's swallowing**. That heat is then turned into color with the curves science uses to describe how we see color.

There's one detail I found really interesting:

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

The temperature goes down as the mass goes up. In other words: **the bigger the black hole, the cooler its disk**. A black hole of a hundred million suns, swallowing at 10 % of its limit, glows blue-white at about 120,000 K. Turn down how much it swallows and the disk turns golden, and the Doppler side gets much more dramatic.

## What it doesn't simulate yet

Scientific mode tries to be honest, so it also says what it doesn't do:

- It assumes a **thin** disk. Black holes like M87\*, the one in the [first real photo](https://eventhorizontelescope.org/) from 2019, swallow so little that their gas forms a thick, hot cloud that this doesn't simulate.
- There's no **jet** and no corona.
- It doesn't recompute the light the disk sends back onto itself.
- The camera stands still. A ship in orbit, like the Endurance, would see the sky slightly shifted.

## If you want to learn more

Inside the website there's a page called **The physics** (`/physics`) that explains every equation step by step, from the Kerr metric to the color of a pixel. It's backed by **27 scientific sources** with verified DOIs. There's also a technical version in the repository: [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

If you use it in a class or a talk, the repository has GitHub's cite button, and the physics page includes a ready-made citation in APA and BibTeX.

## Try it

Open [gargantua.happyuky7.com](https://gargantua.happyuky7.com), drag the mouse to orbit, and press **V** to fly freely almost up to the photon sphere. Try the five presets: *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr* and *Edge-on*. If it stutters, set the quality to *Fast*.

It started as something to pass the time and ended up being one of the things I learned the most from this year. If you end up staring at a black hole for longer than you planned, a ⭐ on the [repository](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) is appreciated.
