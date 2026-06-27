#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
BACKGROUND_DIR = WEB / "public" / "backgrounds"
SEED_DIR = BACKGROUND_DIR / "_imagegen-seeds"
THEME_DIR = WEB / "content" / "themes"
PROMPT_DIR = WEB / "content" / "background-prompts"
CATALOG_PATH = WEB / "content" / "catalog.json"

W, H = 1280, 720
THRESHOLDS = [(0, 0), (1, 1), (2, 6), (3, 15), (4, 30), (5, 60)]


@dataclass(frozen=True)
class ThemeSpec:
  id: str
  name: str
  renderer: str
  style_family: str
  metaphor: str
  overlay: str
  rarity: str
  price: int
  requires_plus: bool
  palette: dict[str, str]
  colors: tuple[str, str, str, str]
  anchor_profile: str
  prompt: str


THEMES: list[ThemeSpec] = [
  ThemeSpec("cozy-fireplace", "Cozy Fireplace", "image", "aesthetic", "room", "dust", "common", 0, False, {
    "--page-0": "#301f1a", "--page-1": "#120d10", "--panel": "#2b211d", "--surface": "#3a2a24",
    "--ink": "#fff0df", "--ink-dim": "#d9c2aa", "--border": "#6a4734", "--ember": "#ff9e64",
    "--glow": "#ffd27d", "--wisp": "#8be0d6", "--bloom": "#f6a7bd", "--rest": "#89a7cc",
  }, ("#241510", "#5b3320", "#ffb15f", "#6da68e"), "room", "cozy fireplace study room, warm lamplight, plants, shelves, window at night"),
  ThemeSpec("rainy-lofi-room", "Rainy Lofi Room", "image", "aesthetic", "room", "rain", "common", 80, False, {
    "--page-0": "#2b3b4e", "--page-1": "#101722", "--panel": "#182333", "--surface": "#223148",
    "--ink": "#edf7ff", "--ink-dim": "#aecaeb", "--border": "#354b67", "--ember": "#ffb46d",
    "--glow": "#ffd58f", "--wisp": "#7bd5e6", "--bloom": "#d59acc", "--rest": "#83b4ef",
  }, ("#111925", "#334a5d", "#f0ac68", "#7bd5e6"), "room", "rainy lofi bedroom study desk, city window, headphones, soft blue evening"),
  ThemeSpec("tokyo-sakura", "Tokyo Sakura", "image", "aesthetic", "room", "dust", "rare", 120, False, {
    "--page-0": "#ffd7e7", "--page-1": "#958cd8", "--panel": "#fff6fb", "--surface": "#f6e6f4",
    "--ink": "#352849", "--ink-dim": "#6b5a88", "--border": "#e7bdd9", "--ember": "#ff926f",
    "--glow": "#ffe08a", "--wisp": "#50bdb4", "--bloom": "#ff8fbd", "--rest": "#839ee8",
  }, ("#7c8fd0", "#ffd4e4", "#ff9bc1", "#55bbb1"), "balcony", "tokyo sakura rooftop balcony study terrace, blossoms, city skyline, calm sunrise"),
  ThemeSpec("seoul-sunrise", "Seoul Sunrise", "image", "aesthetic", "room", "dust", "common", 90, False, {
    "--page-0": "#ffe2b6", "--page-1": "#92bed4", "--panel": "#fffaf1", "--surface": "#f1e7d5",
    "--ink": "#342a25", "--ink-dim": "#766355", "--border": "#e7cba6", "--ember": "#ff996b",
    "--glow": "#ffd27d", "--wisp": "#54b5ae", "--bloom": "#f09ab2", "--rest": "#7faee2",
  }, ("#d5ebef", "#ffcf9e", "#ff996b", "#6bb8af"), "balcony", "seoul sunrise rooftop terrace or courtyard study spot, soft skyline, warm morning"),
  ThemeSpec("academia", "Dark Academia Library", "image", "aesthetic", "room", "dust", "rare", 0, True, {
    "--page-0": "#2d3a2c", "--page-1": "#141a16", "--panel": "#1d2620", "--surface": "#26332a",
    "--ink": "#ece3d0", "--ink-dim": "#c2b596", "--border": "#3e4f3c", "--ember": "#c98a5a",
    "--glow": "#d4b483", "--wisp": "#89b487", "--bloom": "#c08a6a", "--rest": "#7a9a8a",
  }, ("#111711", "#303d2e", "#d4a15e", "#89b487"), "library", "dark academia library study room, shelves, brass lamp, leather chair"),
  ThemeSpec("forest-cabin", "Forest Cabin", "image", "aesthetic", "garden", "fireflies", "rare", 130, False, {
    "--page-0": "#29473a", "--page-1": "#0e1a16", "--panel": "#172a22", "--surface": "#233b31",
    "--ink": "#eff8ea", "--ink-dim": "#b8d0b1", "--border": "#385c4b", "--ember": "#e0a35e",
    "--glow": "#f8d77c", "--wisp": "#8be0b1", "--bloom": "#df9fa9", "--rest": "#80aac8",
  }, ("#0d1914", "#2f5743", "#e1a75b", "#8be0b1"), "cabin", "forest cabin study desk, mossy window, warm cabin light, quiet woods"),
  ThemeSpec("snow-window", "Snow Window", "image", "aesthetic", "room", "snow", "common", 100, False, {
    "--page-0": "#d7e5f7", "--page-1": "#1c2a3d", "--panel": "#f7fbff", "--surface": "#e6eef8",
    "--ink": "#1c2a3d", "--ink-dim": "#5a6b80", "--border": "#c7d6e8", "--ember": "#e58f65",
    "--glow": "#f7d88c", "--wisp": "#68b8c5", "--bloom": "#da9dbe", "--rest": "#7faee8",
  }, ("#19283a", "#d8e8f5", "#f1b47a", "#74b8c5"), "window", "quiet winter window study room, snowfall outside, blanket and tea"),
  ThemeSpec("ocean-balcony", "Ocean Balcony", "image", "aesthetic", "island", "none", "common", 90, False, {
    "--page-0": "#a6e0e5", "--page-1": "#2c6990", "--panel": "#f7fff9", "--surface": "#dff0ec",
    "--ink": "#15334a", "--ink-dim": "#526f7e", "--border": "#afd7d7", "--ember": "#ff9d6a",
    "--glow": "#ffe18e", "--wisp": "#4bbfae", "--bloom": "#f092b6", "--rest": "#76b8e8",
  }, ("#5cbbd0", "#e8f6ec", "#ffb36a", "#4bbfae"), "balcony", "ocean balcony study nook, open sea view, gentle sunlight, clean desk"),
  ThemeSpec("garden-greenhouse", "Garden Greenhouse", "image", "aesthetic", "garden", "fireflies", "rare", 140, False, {
    "--page-0": "#bde9cb", "--page-1": "#2d6b52", "--panel": "#f6fff5", "--surface": "#dcefdc",
    "--ink": "#1d3d2f", "--ink-dim": "#567764", "--border": "#acd2ad", "--ember": "#f0a66e",
    "--glow": "#f4d76e", "--wisp": "#48b897", "--bloom": "#ee91ac", "--rest": "#7baed4",
  }, ("#d6f1d0", "#3c8a63", "#f0a66e", "#48b897"), "greenhouse", "garden greenhouse study table, plants, glass roof, gentle afternoon"),
  ThemeSpec("train-window", "Train Window", "image", "aesthetic", "room", "rain", "rare", 150, False, {
    "--page-0": "#384d62", "--page-1": "#171d29", "--panel": "#202b39", "--surface": "#2a394a",
    "--ink": "#eff5f6", "--ink-dim": "#b5c7d2", "--border": "#42586f", "--ember": "#f1a35f",
    "--glow": "#f5d477", "--wisp": "#78ccd0", "--bloom": "#d79ab0", "--rest": "#88afe8",
  }, ("#141c26", "#456175", "#efab61", "#78ccd0"), "window", "train window study booth, rainy landscape, portable desk, quiet travel"),
  ThemeSpec("space-observatory", "Space Observatory", "image", "aesthetic", "nightSky", "stars", "rare", 180, False, {
    "--page-0": "#1f2455", "--page-1": "#070917", "--panel": "#151936", "--surface": "#242a58",
    "--ink": "#f0efff", "--ink-dim": "#b8b8e8", "--border": "#3d4588", "--ember": "#ff9e7d",
    "--glow": "#ffd27d", "--wisp": "#8be0f0", "--bloom": "#dba7ff", "--rest": "#8fa8ff",
  }, ("#070917", "#252b66", "#ffd27d", "#8be0f0"), "observatory", "space observatory study room, telescope, stars, quiet cosmic desk"),
  ThemeSpec("cloud-loft", "Cloud Loft", "image", "aesthetic", "island", "none", "common", 110, False, {
    "--page-0": "#dce9ff", "--page-1": "#91b9e4", "--panel": "#ffffff", "--surface": "#edf4ff",
    "--ink": "#24304c", "--ink-dim": "#667293", "--border": "#cbd8f0", "--ember": "#ffa173",
    "--glow": "#ffe08a", "--wisp": "#60bfc8", "--bloom": "#f2a3c5", "--rest": "#87aef0",
  }, ("#8fb6e8", "#f8fbff", "#ffa173", "#60bfc8"), "loft", "cloud loft study room, sky view, floating shelves, airy soft light"),
  ThemeSpec("tokyo-night", "Pixel Night Meadow", "pixel", "pixel", "nightSky", "stars", "common", 0, False, {
    "--page-0": "#13112a", "--page-1": "#0e0c20", "--panel": "#191634", "--surface": "#201c40",
    "--ink": "#ece9ff", "--ink-dim": "#bcb5e8", "--border": "#3a3470", "--ember": "#ff9e6d",
    "--glow": "#ffd27d", "--wisp": "#8be0d6", "--bloom": "#f3a9cb", "--rest": "#8fb8f0",
  }, ("#14112e", "#8bd9cd", "#ffd27d", "#f3a9cb"), "pixel", "current Wispal pixel night meadow with staged stars, pines, pond, and aurora"),
  ThemeSpec("dawn", "Pixel Dawn Grove", "image", "pixel", "garden", "dust", "common", 120, False, {
    "--page-0": "#fdf3f8", "--page-1": "#e3ddf6", "--panel": "#ffffff", "--surface": "#f3eefb",
    "--ink": "#2a2348", "--ink-dim": "#5a5280", "--border": "#e3def5", "--ember": "#ff9e6d",
    "--glow": "#ffe08a", "--wisp": "#4fb3a6", "--bloom": "#e98bb6", "--rest": "#6f9be0",
  }, ("#b8e6dc", "#fdf3f8", "#ffe08a", "#4fb3a6"), "pixel", "pixel dawn grove, pastel morning, blocky trees and warm study light"),
  ThemeSpec("lofi", "Pixel Lofi Cafe", "image", "pixel", "room", "rain", "rare", 0, True, {
    "--page-0": "#5a4334", "--page-1": "#2a1d16", "--panel": "#3a2a20", "--surface": "#4a3528",
    "--ink": "#f5e6d5", "--ink-dim": "#d8b89a", "--border": "#6a4f3a", "--ember": "#e8b87a",
    "--glow": "#ffd27d", "--wisp": "#a8c4a0", "--bloom": "#d99a7a", "--rest": "#c2a07a",
  }, ("#2a1d16", "#6a4f3a", "#ffd27d", "#a8c4a0"), "pixel", "pixel lofi cafe background, blocky lamp glow, rain window, warm study booth"),
  ThemeSpec("pastel", "Pixel Star Pond", "image", "pixel", "island", "fireflies", "rare", 150, False, {
    "--page-0": "#d7c8f5", "--page-1": "#b8e6dc", "--panel": "#ffffff", "--surface": "#efe8fb",
    "--ink": "#3a2f5e", "--ink-dim": "#6a5e92", "--border": "#d9c2ec", "--ember": "#ff9e6d",
    "--glow": "#ffe08a", "--wisp": "#4bbfae", "--bloom": "#ff8fb3", "--rest": "#7aa9f0",
  }, ("#b8e6dc", "#d7c8f5", "#ffe08a", "#ff8fb3"), "pixel", "pixel pastel star pond, candy colored sky, blocky water and soft wisps"),
]


NON_THEME_ITEMS = [
  {"id": "shop_companion_lumen", "type": "companion", "packId": "lumen", "name": "Lumen the Ghost", "description": "A friendly study-haunt with the most expressive face.", "price": 300, "requiresPlus": False, "rarity": "rare"},
  {"id": "shop_companion_mote", "type": "companion", "packId": "mote", "name": "Mote the Orb", "description": "The calmest spirit. Zero whimsy, pure focus.", "price": 300, "requiresPlus": False, "rarity": "rare"},
  {"id": "shop_companion_ember", "type": "companion", "packId": "ember", "name": "Ember the Lantern", "description": "A little carried light. Warmest of the four.", "price": 0, "requiresPlus": True, "rarity": "event"},
  {"id": "shop_voice_sassy", "type": "voicePack", "packId": "sassy", "name": "Sassy voice pack", "description": "A buddy with bite. Same warmth, more attitude.", "price": 0, "requiresPlus": True, "rarity": "rare"},
  {"id": "shop_decor_lantern", "type": "decor", "packId": "decor_lantern", "name": "Tiny lantern", "description": "A little light for the edge of your night.", "price": 90, "requiresPlus": False, "rarity": "common"},
  {"id": "shop_decor_cushion", "type": "decor", "packId": "decor_cushion", "name": "Rest cushion", "description": "A soft reminder that breaks count too.", "price": 110, "requiresPlus": False, "rarity": "rare"},
  {"id": "shop_action_dance_pack", "type": "actionPack", "packId": "dance_pack", "name": "Tiny dance pack", "description": "Unlocks extra happy dances for taps, goals, and celebration moments.", "price": 160, "requiresPlus": False, "rarity": "rare"},
  {"id": "shop_action_study_pose_pack", "type": "actionPack", "packId": "study_pose_pack", "name": "Study pose pack", "description": "Adds page turns and focused desk poses when your wisp studies beside you.", "price": 140, "requiresPlus": False, "rarity": "common"},
  {"id": "shop_action_rest_pose_pack", "type": "actionPack", "packId": "rest_pose_pack", "name": "Rest pose pack", "description": "Adds softer tea and curl-up moments when you accept a break.", "price": 120, "requiresPlus": False, "rarity": "common"},
  {"id": "shop_action_celebration_pack", "type": "actionPack", "packId": "celebration_pack", "name": "Celebration pack", "description": "Adds bigger star bursts for completed quests, sessions, and goal days.", "price": 180, "requiresPlus": False, "rarity": "rare"},
]


def rgb(hex_color: str) -> tuple[int, int, int]:
  value = hex_color.lstrip("#")
  return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
  return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def gradient(top: str, bottom: str) -> Image.Image:
  img = Image.new("RGB", (W, H), rgb(top))
  draw = ImageDraw.Draw(img)
  a, b = rgb(top), rgb(bottom)
  for y in range(H):
    t = y / max(1, H - 1)
    draw.line([(0, y), (W, y)], fill=mix(a, b, t))
  return img


def rounded(draw: ImageDraw.ImageDraw, xy, radius: int, fill, outline=None, width: int = 1):
  draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_window(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, stage: int, theme: ThemeSpec):
  rounded(draw, (x, y, x + w, y + h), 18, fill=(24, 32, 48), outline=rgb(theme.colors[2]), width=3)
  draw.rectangle((x + w // 2 - 3, y + 8, x + w // 2 + 3, y + h - 8), fill=(70, 72, 89))
  draw.rectangle((x + 8, y + h // 2 - 3, x + w - 8, y + h // 2 + 3), fill=(70, 72, 89))
  for i in range(18 + stage * 8):
    px = x + 18 + ((i * 47) % max(1, w - 36))
    py = y + 18 + ((i * 31) % max(1, h - 36))
    color = rgb(theme.colors[2]) if i % 5 == 0 else (226, 236, 255)
    draw.ellipse((px, py, px + 2 + stage % 3, py + 2 + stage % 3), fill=color)
  if theme.overlay == "rain":
    for i in range(30 + stage * 10):
      px = x + 12 + ((i * 29) % max(1, w - 24))
      py = y + 8 + ((i * 43) % max(1, h - 16))
      draw.line((px, py, px - 8, py + 20), fill=(150, 190, 215), width=1)
  if theme.overlay == "snow":
    for i in range(28 + stage * 12):
      px = x + 12 + ((i * 37) % max(1, w - 24))
      py = y + 8 + ((i * 41) % max(1, h - 16))
      draw.ellipse((px, py, px + 4, py + 4), fill=(238, 246, 255))


def draw_lamp(draw: ImageDraw.ImageDraw, x: int, y: int, stage: int, theme: ThemeSpec):
  glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
  gd = ImageDraw.Draw(glow)
  gd.ellipse((x - 110, y - 120, x + 110, y + 100), fill=(*rgb(theme.colors[2]), 34 + stage * 10))
  return glow


def draw_books(draw: ImageDraw.ImageDraw, x: int, y: int, count: int, theme: ThemeSpec):
  colors = [rgb(theme.colors[2]), rgb(theme.colors[3]), (202, 155, 185), (102, 116, 150)]
  for i in range(count):
    h = 32 + (i * 11) % 48
    draw.rectangle((x + i * 15, y - h, x + i * 15 + 11, y), fill=colors[i % len(colors)])
    draw.line((x + i * 15 + 2, y - h + 5, x + i * 15 + 9, y - h + 5), fill=(35, 30, 40), width=1)


def draw_plant(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, theme: ThemeSpec):
  pot = rgb(theme.colors[2])
  leaf = rgb(theme.colors[3])
  draw.rounded_rectangle((x - 16 * scale, y - 18 * scale, x + 16 * scale, y + 10 * scale), radius=int(5 * scale), fill=pot)
  for i in range(7):
    dx = (i - 3) * 9 * scale
    draw.ellipse((x + dx - 13 * scale, y - 55 * scale - abs(i - 3) * 2, x + dx + 15 * scale, y - 26 * scale), fill=leaf)


def draw_room_scene(theme: ThemeSpec, stage: int) -> Image.Image:
  img = gradient(theme.colors[0], theme.colors[1]).convert("RGBA")
  draw = ImageDraw.Draw(img, "RGBA")
  floor = mix(rgb(theme.colors[1]), rgb(theme.colors[2]), 0.24)
  draw.polygon([(0, 520), (W, 470), (W, H), (0, H)], fill=(*floor, 255))
  draw.polygon([(0, 0), (W, 0), (W, 495), (0, 540)], fill=(*mix(rgb(theme.colors[0]), rgb(theme.colors[1]), 0.55), 105))
  draw_window(draw, 456, 70, 370, 250, stage, theme)
  rounded(draw, (800, 255, 1160, 462), 16, fill=(*mix(rgb(theme.colors[1]), rgb(theme.colors[2]), 0.28), 235), outline=(*rgb(theme.colors[2]), 190), width=2)
  rounded(draw, (860, 462, 1142, 484), 7, fill=(*rgb(theme.colors[2]), 230))
  for i in range(3):
    y = 110 + i * 74
    rounded(draw, (78, y, 380, y + 16), 4, fill=(*mix(rgb(theme.colors[2]), (255, 255, 255), 0.1), 235))
    draw_books(draw, 104, y, min(8 + stage * 2, 18), theme)
  if stage >= 1:
    draw_plant(draw, 260, 477, 1.1, theme)
  if stage >= 2:
    draw_books(draw, 880, 344, 11 + stage, theme)
    draw_plant(draw, 1032, 346, 0.75, theme)
  if stage >= 3:
    for i in range(5 + stage):
      x = 760 + i * 42
      draw.line((x, 155 + (i % 2) * 9, x + 4, 170 + (i % 2) * 9), fill=(*rgb(theme.colors[2]), 255), width=4)
      draw.ellipse((x - 10, 142 + (i % 2) * 9, x + 14, 166 + (i % 2) * 9), fill=(*rgb(theme.colors[2]), 64))
  if stage >= 4:
    draw_plant(draw, 1130, 570, 1.35, theme)
    rounded(draw, (86, 452, 260, 505), 18, fill=(*mix(rgb(theme.colors[3]), (255, 255, 255), 0.18), 178))
  if stage >= 5:
    for i in range(18):
      x = 340 + (i * 37) % 580
      y = 365 + (i * 19) % 120
      draw.ellipse((x, y, x + 6, y + 6), fill=(*rgb(theme.colors[3]), 190))
  draw.rounded_rectangle((390, 505, 884, 700), radius=86, fill=(*mix(rgb(theme.colors[2]), (255, 255, 255), 0.4), 108))
  glow = draw_lamp(draw, 1000, 278, stage, theme)
  img = Image.alpha_composite(img, glow)
  return img.convert("RGB")


def draw_pixel_tree(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int, color: tuple[int, int, int]):
  draw.polygon([(x, y - 82 * scale), (x - 32 * scale, y - 28 * scale), (x + 32 * scale, y - 28 * scale)], fill=color)
  draw.polygon([(x, y - 56 * scale), (x - 42 * scale, y + 18 * scale), (x + 42 * scale, y + 18 * scale)], fill=color)
  draw.rectangle((x - 4 * scale, y + 14 * scale, x + 4 * scale, y + 34 * scale), fill=color)


def draw_pixel_scene(theme: ThemeSpec, stage: int) -> Image.Image:
  img = gradient(theme.colors[0], theme.colors[1]).convert("RGBA")
  draw = ImageDraw.Draw(img, "RGBA")
  draw.polygon([(0, 520), (280, 450), (660, 482), (W, 430), (W, H), (0, H)], fill=(*mix(rgb(theme.colors[3]), rgb(theme.colors[1]), 0.52), 255))
  draw.rectangle((0, 560, W, H), fill=(*mix(rgb(theme.colors[3]), rgb(theme.colors[0]), 0.48), 255))
  for i in range(18 + stage * 16):
    x = 45 + (i * 67) % (W - 90)
    y = 38 + (i * 47) % 310
    size = 3 + (i + stage) % 5
    fill = rgb(theme.colors[2]) if i % 4 == 0 else rgb(theme.colors[3]) if i % 5 == 0 else (236, 233, 255)
    draw.rectangle((x, y, x + size, y + size), fill=(*fill, 210))
  if stage >= 1:
    draw.ellipse((102, 95, 218, 211), fill=(*rgb(theme.colors[2]), 210))
  if stage >= 2:
    draw_pixel_tree(draw, 155, 520, 2, (8, 20, 31))
    draw_pixel_tree(draw, 300, 520, 1, (8, 20, 31))
  if stage >= 3:
    draw.ellipse((820, 585, 1130, 655), fill=(*rgb(theme.colors[3]), 120))
    draw.ellipse((910, 606, 1000, 622), fill=(25, 35, 63, 90))
  if stage >= 4:
    for i in range(4):
      x = 410 + i * 116
      draw.ellipse((x - 18, 525, x + 18, 561), fill=(*rgb(theme.colors[2]), 90))
      draw.rectangle((x - 5, 535, x + 5, 586), fill=(*rgb(theme.colors[2]), 220))
  if stage >= 5:
    draw.line((0, 108, 280, 48, 560, 96, 860, 50, W, 72), fill=(*rgb(theme.colors[3]), 98), width=22)
    draw.line((0, 148, 360, 92, 670, 142, 1000, 84, W, 132), fill=(*rgb(theme.colors[2]), 78), width=18)
  draw.ellipse((500, 580, 780, 640), fill=(15, 24, 42, 62))
  return img.convert("RGB")


def draw_special_scene(theme: ThemeSpec, stage: int) -> Image.Image:
  img = draw_room_scene(theme, stage)
  draw = ImageDraw.Draw(img, "RGBA")
  if theme.id == "cozy-fireplace":
    draw.rounded_rectangle((68, 230, 300, 500), radius=32, fill=(68, 44, 32, 230), outline=(*rgb(theme.colors[2]), 120), width=5)
    draw.rectangle((124, 344, 246, 494), fill=(38, 20, 14, 255))
    for i in range(5 + stage):
      x = 140 + i * 17
      draw.polygon([(x, 470), (x + 14, 395 - (i % 3) * 18), (x + 28, 470)], fill=(*rgb(theme.colors[2]), 210))
      draw.polygon([(x + 8, 470), (x + 20, 424 - (i % 2) * 12), (x + 30, 470)], fill=(255, 222, 115, 210))
  elif theme.id == "garden-greenhouse":
    for x in range(40, W, 130):
      draw.line((x, 0, x + 180, 350), fill=(255, 255, 255, 46), width=3)
  elif theme.id == "space-observatory":
    draw.ellipse((118, 112, 340, 334), outline=(*rgb(theme.colors[3]), 180), width=6)
    draw.line((230, 224, 340, 380), fill=(*rgb(theme.colors[3]), 170), width=8)
  elif theme.id == "train-window":
    draw.rounded_rectangle((390, 104, 890, 420), radius=34, outline=(*rgb(theme.colors[2]), 210), width=12)
    for i in range(6):
      draw.line((420 + i * 90, 400, 510 + i * 90, 340), fill=(*rgb(theme.colors[3]), 90), width=3)
  elif theme.id == "ocean-balcony":
    draw.rectangle((0, 300, W, 462), fill=(80, 170, 198, 180))
    for y in [345, 384, 424]:
      draw.arc((120, y - 24, 1160, y + 58), 185, 355, fill=(245, 255, 255, 90), width=4)
  return img


def seed_path_for(theme: ThemeSpec) -> Path | None:
  env_value = os.environ.get(f"WISPAL_SEED_{theme.id.replace('-', '_').upper()}")
  if env_value:
    path = Path(env_value)
    if path.exists() and path.is_file():
      return path
  path = SEED_DIR / f"{theme.id}.png"
  return path if path.exists() and path.is_file() else None


def cover_seed(path: Path) -> Image.Image:
  source = Image.open(path).convert("RGB")
  ratio = W / H
  source_ratio = source.width / source.height
  if source_ratio > ratio:
    new_w = int(source.height * ratio)
    left = (source.width - new_w) // 2
    source = source.crop((left, 0, left + new_w, source.height))
  elif source_ratio < ratio:
    new_h = int(source.width / ratio)
    top = (source.height - new_h) // 2
    source = source.crop((0, top, source.width, top + new_h))
  return source.resize((W, H), Image.Resampling.LANCZOS)


def add_vignette(img: Image.Image, strength: int) -> Image.Image:
  overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
  draw = ImageDraw.Draw(overlay)
  for i in range(28):
    alpha = int(strength * (i / 27) ** 1.7)
    inset_x = int(W * i / 56)
    inset_y = int(H * i / 56)
    draw.rectangle((inset_x, inset_y, W - inset_x, H - inset_y), outline=(0, 0, 0, alpha), width=12)
  return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def add_seed_growth_marks(img: Image.Image, theme: ThemeSpec, stage: int) -> Image.Image:
  if stage <= 0:
    return img
  overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
  draw = ImageDraw.Draw(overlay, "RGBA")
  warm = rgb(theme.colors[2])
  cool = rgb(theme.colors[3])
  for i in range(stage * 10):
    # Keep growth sparkle to edges/upper scene so the pet and timer stay readable.
    edge_band = i % 4
    if edge_band == 0:
      x = 70 + (i * 83) % 280
      y = 70 + (i * 47) % 310
    elif edge_band == 1:
      x = W - 350 + (i * 61) % 280
      y = 65 + (i * 53) % 310
    elif edge_band == 2:
      x = 70 + (i * 97) % (W - 140)
      y = 42 + (i * 37) % 120
    else:
      x = 100 + (i * 71) % (W - 200)
      y = 430 + (i * 41) % 70
    color = warm if i % 3 else cool
    radius = 1 + (i + stage) % 3
    draw.ellipse((x, y, x + radius, y + radius), fill=(*color, 42 + stage * 12))
  if stage >= 4:
    for i in range(6):
      x1 = 180 + i * 150
      y1 = 105 + (i % 2) * 24
      x2 = x1 + 80
      y2 = y1 + 10
      draw.line((x1, y1, x2, y2), fill=(*warm, 34), width=2)
      draw.ellipse((x2 - 4, y2 - 4, x2 + 4, y2 + 4), fill=(*warm, 70))
  return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def use_seed_image(theme: ThemeSpec, stage: int, fallback: Image.Image) -> Image.Image:
  source = seed_path_for(theme)
  if not source:
    return fallback
  canvas = cover_seed(source)
  brightness = [0.9, 0.94, 0.98, 1.02, 1.08, 1.14][stage]
  saturation = [0.92, 0.96, 1.0, 1.04, 1.08, 1.12][stage]
  contrast = [0.98, 1.0, 1.02, 1.04, 1.06, 1.08][stage]
  canvas = ImageEnhance.Brightness(canvas).enhance(brightness)
  canvas = ImageEnhance.Color(canvas).enhance(saturation)
  canvas = ImageEnhance.Contrast(canvas).enhance(contrast)
  canvas = add_vignette(canvas, 18 if stage < 3 else 14)
  canvas = add_seed_growth_marks(canvas, theme, stage)
  return canvas


def save_stage(theme: ThemeSpec, stage: int) -> str:
  out_dir = BACKGROUND_DIR / theme.id
  out_dir.mkdir(parents=True, exist_ok=True)
  if theme.renderer == "pixel":
    img = draw_pixel_scene(theme, stage)
  else:
    img = draw_special_scene(theme, stage)
    img = use_seed_image(theme, stage, img)
  img = img.filter(ImageFilter.UnsharpMask(radius=0.5, percent=110, threshold=3))
  png_path = out_dir / f"stage-{stage}.png"
  webp_path = out_dir / f"stage-{stage}.webp"
  if os.environ.get("WISPAL_KEEP_STAGE_PNG") == "1":
    img.save(png_path, "PNG", optimize=True)
  elif png_path.exists():
    png_path.unlink()
  try:
    img.save(webp_path, "WEBP", quality=84, method=6)
    return f"/backgrounds/{theme.id}/stage-{stage}.webp"
  except Exception:
    img.save(png_path, "PNG", optimize=True)
    return f"/backgrounds/{theme.id}/stage-{stage}.png"


def anchors(profile: str) -> dict[str, dict[str, float]]:
  presets = {
    "room": {"center": (0.5, 0.57), "left": (0.23, 0.66), "right": (0.78, 0.68), "rest": (0.39, 0.64), "decor": (0.72, 0.58), "lamp": (0.78, 0.48), "pond": (0.34, 0.64), "quest": (0.5, 0.23), "timer": (0.5, 0.82)},
    "balcony": {"center": (0.5, 0.62), "left": (0.3, 0.64), "right": (0.73, 0.62), "rest": (0.38, 0.68), "decor": (0.74, 0.6), "lamp": (0.72, 0.5), "pond": (0.28, 0.64), "quest": (0.5, 0.23), "timer": (0.5, 0.82)},
    "library": {"center": (0.48, 0.61), "left": (0.25, 0.65), "right": (0.75, 0.66), "rest": (0.34, 0.67), "decor": (0.68, 0.62), "lamp": (0.78, 0.5), "pond": (0.32, 0.68), "quest": (0.5, 0.22), "timer": (0.5, 0.82)},
    "cabin": {"center": (0.5, 0.62), "left": (0.22, 0.67), "right": (0.77, 0.66), "rest": (0.37, 0.68), "decor": (0.64, 0.63), "lamp": (0.26, 0.56), "pond": (0.8, 0.66), "quest": (0.5, 0.22), "timer": (0.5, 0.82)},
    "window": {"center": (0.51, 0.61), "left": (0.28, 0.66), "right": (0.76, 0.65), "rest": (0.38, 0.67), "decor": (0.7, 0.62), "lamp": (0.75, 0.5), "pond": (0.3, 0.66), "quest": (0.5, 0.22), "timer": (0.5, 0.82)},
    "greenhouse": {"center": (0.5, 0.63), "left": (0.24, 0.67), "right": (0.76, 0.65), "rest": (0.36, 0.68), "decor": (0.66, 0.64), "lamp": (0.68, 0.52), "pond": (0.82, 0.66), "quest": (0.5, 0.22), "timer": (0.5, 0.82)},
    "observatory": {"center": (0.5, 0.61), "left": (0.25, 0.66), "right": (0.78, 0.64), "rest": (0.36, 0.68), "decor": (0.67, 0.6), "lamp": (0.78, 0.5), "pond": (0.29, 0.64), "quest": (0.5, 0.22), "timer": (0.5, 0.82)},
    "loft": {"center": (0.5, 0.62), "left": (0.29, 0.65), "right": (0.76, 0.63), "rest": (0.38, 0.68), "decor": (0.68, 0.61), "lamp": (0.76, 0.5), "pond": (0.28, 0.65), "quest": (0.5, 0.22), "timer": (0.5, 0.82)},
    "pixel": {"center": (0.5, 0.5), "left": (0.23, 0.64), "right": (0.78, 0.68), "rest": (0.32, 0.7), "decor": (0.62, 0.64), "lamp": (0.23, 0.68), "pond": (0.76, 0.72), "quest": (0.5, 0.2), "timer": (0.5, 0.82)},
  }
  return {key: {"x": value[0], "y": value[1]} for key, value in presets[profile].items()}


def stage_prompt(theme: ThemeSpec, stage: int) -> str:
  additions = [
    "quiet empty scene, minimal study setup, clear lower-center pet-safe zone",
    "first visible sign of progress, one warm light or small plant added",
    "scene begins filling with books, plants, lamps, and gentle focus details",
    "stronger study identity, organized tools, richer weather or view",
    "warm lived-in study sanctuary, cozy decor, layered ambience, still calm",
    "legendary mature scene, magical wisps and polished cozy details, no clutter behind timer",
  ][stage]
  return f"16:9 {theme.prompt}; {additions}; no text, no logos, no watermark."


def write_json(path: Path, data):
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def build_theme(theme: ThemeSpec) -> dict:
  stages = []
  prompts = []
  for stage, min_growth in THRESHOLDS:
    src = save_stage(theme, stage)
    prompt_id = f"{theme.id}-stage-{stage}"
    stages.append({
      "stage": stage,
      "minGrowth": min_growth,
      "src": src,
      "blurSrc": src,
      "promptId": prompt_id,
    })
    prompts.append({
      "id": prompt_id,
      "stage": stage,
      "minGrowth": min_growth,
      "prompt": stage_prompt(theme, stage),
    })
  theme_pack = {
    "id": theme.id,
    "name": theme.name,
    "metaphor": theme.metaphor,
    "palette": theme.palette,
    "musicRef": None,
    "rarity": theme.rarity,
    "renderer": theme.renderer,
    "styleFamily": theme.style_family,
    "backgroundStages": stages,
    "petAnchors": anchors(theme.anchor_profile),
    "overlayProfile": theme.overlay,
  }
  write_json(THEME_DIR / f"{theme.id}.json", theme_pack)
  write_json(PROMPT_DIR / f"{theme.id}.json", {
    "themeId": theme.id,
    "themeName": theme.name,
    "source": "imagegen-seeded" if seed_path_for(theme) else "procedural-fixture",
    "seedPath": f"/backgrounds/_imagegen-seeds/{theme.id}.png" if seed_path_for(theme) else None,
    "compositionContract": [
      "16:9 study background",
      "no text, logos, or watermarks",
      "clear lower-center pet-safe zone",
      "avoid busy detail behind timer and input panel",
      "same camera and framing across growth stages",
    ],
    "prompts": prompts,
  })
  return theme_pack


def catalog_item(theme: ThemeSpec) -> dict:
  return {
    "id": f"shop_theme_{theme.id.replace('-', '_')}",
    "type": "theme",
    "packId": theme.id,
    "name": theme.name,
    "description": f"{theme.name} study scene with six visual growth stages.",
    "price": theme.price,
    "requiresPlus": theme.requires_plus,
    "rarity": theme.rarity,
  }


def main():
  BACKGROUND_DIR.mkdir(parents=True, exist_ok=True)
  THEME_DIR.mkdir(parents=True, exist_ok=True)
  PROMPT_DIR.mkdir(parents=True, exist_ok=True)
  theme_packs = [build_theme(theme) for theme in THEMES]
  write_json(THEME_DIR / "index.json", theme_packs)
  write_json(CATALOG_PATH, [catalog_item(theme) for theme in THEMES] + NON_THEME_ITEMS)
  print(f"Generated {len(THEMES)} theme packs and {len(THEMES) * len(THRESHOLDS)} staged backgrounds.")


if __name__ == "__main__":
  main()
