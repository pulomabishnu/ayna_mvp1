"""Runs the REAL quiz once with fictional answers (persona_actions.json) and
saves the browser state (localStorage only) to persona_state.json.

Fictional persona: age 34, regular periods, cramps + heavy periods,
fragrance sensitivity, no medicines, no known diagnoses. Not a real person.
Sleep is deliberately NOT one of her stated goals, so discovery in the film
can't be mistaken for something Oura data drove."""
import json
from app import *
from quiz_probe import run
with sync_playwright() as p:
    b, ctx, pg = open_app(p, scale=1)
    assert run(pg, json.load(open('persona_actions.json')))
    pg.wait_for_timeout(2000)
    ctx.storage_state(path='persona_state.json')
    keys = pg.evaluate('Object.keys(localStorage)'); print(keys)
    b.close()
