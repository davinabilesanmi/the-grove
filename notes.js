// The garden's notes. Add a new one by copying an entry below.
// - stage: "seedling" (rough), "budding" (growing), or "evergreen" (mature)
// - Link to another note with [[Its Title]]. Links to notes that don't exist yet become "seeds".
// - Every first-time visitor starts with these notes. Notes planted in the browser are saved
//   there, and can be exported to (and imported from) a .txt file from the footer.
window.GARDEN_NOTES = [
  {
    title: "Welcome to the garden",
    stage: "evergreen",
    tags: ["meta"],
    planted: "2026-10-01",
    tended: "2026-10-15",
    body: `Hello, and welcome in. This is my **digital garden**: a growing collection of recipes, kitchen notes and ideas that link to each other.

Unlike a blog, nothing here is "finished". Notes get revisited, tweaked and connected over time, just like a recipe you keep improving. Each one is marked with how grown it is — see [[Growth stages]].

## What's cooking

- 🍚 [[Jollof rice]] — my go-to pot of jollof
- 🍫 [[Easy fudgy brownies]] — rich, gooey and quick
- 🍰 [[Busy baker's to-do list]] — how I keep a baking day on track

## Finding your way

- Read [[How this garden grows]] to learn how to add notes
- See why links matter in [[Linking your thinking]]
- Or open the **Map** to see everything at once

> Plant ideas, tend them often, and let them grow into each other.`
  },
  {
    title: "How this garden grows",
    stage: "evergreen",
    tags: ["meta", "how-to"],
    planted: "2026-10-01",
    tended: "2026-10-15",
    body: `There are two ways to add a note.

## 1. Plant it in the browser

Click **+ Plant** at the top. Give it a title, pick a growth stage, and write in Markdown. Link to other notes with double square brackets, like \`[[Jollof rice]]\`.

Notes you plant are saved in this browser. To back them up, use **export them as a .txt file** in the footer — it downloads every note as plain text you can read in any app. Use **import a backup** to bring them back, on this browser or another one.

## 2. Edit notes.js

The notes every new visitor sees live in \`notes.js\`. Copy an entry, change the title and body, and refresh.

## Markdown you can use

- \`**bold**\` and \`*italic*\`
- \`## Headings\`
- Lists with \`-\` or \`1.\`, and tasks with \`- [ ]\` / \`- [x]\`
- \`> quotes\` and \`[links](https://example.com)\`

See also: [[Linking your thinking]].`
  },
  {
    title: "Growth stages",
    stage: "budding",
    tags: ["meta"],
    planted: "2026-10-02",
    tended: "2026-10-15",
    body: `Every note shows how grown it is, so readers know what to expect.

- 🌱 **Seedling** — a rough idea, freshly planted. Might be just a sentence.
- 🌿 **Budding** — revised a few times, starting to take shape.
- 🌳 **Evergreen** — tried, tested and fairly settled, like [[Jollof rice]].

And then there are **seeds**: ideas that a note links to but which haven't been written yet. They show up as dashed links. Click one to plant it.

It takes the pressure off — a note doesn't have to be perfect to go in the garden.`
  },
  {
    title: "Linking your thinking",
    stage: "budding",
    tags: ["meta", "thinking"],
    planted: "2026-10-03",
    tended: "2026-10-15",
    body: `The magic of a garden is in the connections. A note on its own is a single tree; linked notes become a forest.

Whenever a note mentions another idea, link it. The [[Busy baker's to-do list]] says "bake brownies", so it links straight to [[Easy fudgy brownies]]. Every link works both ways — the brownies note lists the to-do list under **Linked from**.

Over time, unexpected paths appear between notes you wrote months apart.

## A few habits

1. Link generously, even to notes that don't exist yet
2. Revisit old notes and add links to newer ones
3. Use the Map to spot lonely notes with no connections`
  },
  {
    title: "Jollof rice",
    stage: "evergreen",
    tags: ["recipes", "nigerian", "rice"],
    planted: "2026-10-15",
    tended: "2026-10-15",
    body: `Serves 2–3.

## Ingredients

- 2 cups long-grain parboiled rice
- 3 medium tomatoes
- 2 large red bell peppers (tatashe/bawa)
- 1–2 scotch bonnets (rodo), to taste
- 1 large onion, divided
- 3 tablespoons tomato paste
- ⅓ cup vegetable oil
- About 2½–3 cups hot chicken stock or water
- 1 teaspoon thyme
- 1–2 seasoning cubes, depending on how salty your stock is
- Salt to taste
- Optional: curry powder and 2 bay leaves

## Method

1. **Blend** tomatoes, peppers, rodo and half the onion with very little water. Boil the mixture until thick and most of the water has evaporated.
2. **Build the sauce:** heat oil in a pot. Fry the remaining sliced onion for 2 minutes. Add tomato paste and fry for 5–7 minutes, stirring. Add the blended mixture and cook for another 10–15 minutes, until thick and the oil begins separating.
3. **Season:** add thyme, optional spices, stock and seasoning cubes. Taste before adding salt.
4. **Add the rice:** add washed, drained rice. Start with 2½ cups liquid; it should just cover the rice. Bring to a simmer.
5. **Steam:** cover tightly with foil beneath the lid. Cook on the lowest heat for 25–35 minutes. Avoid frequent stirring or opening.
6. **Check:** if still firm, sprinkle in ¼ cup hot water, cover and steam for another 5–10 minutes. Once tender, turn off the heat, rest for 10 minutes and fluff.

> **The main thing to watch:** rice brands absorb water differently. Add extra water gradually — too much at once makes jollof mushy.

Curry is optional; you can leave it out.

For something sweet afterwards: [[Easy fudgy brownies]].`
  },
  {
    title: "Easy fudgy brownies",
    stage: "evergreen",
    tags: ["recipes", "baking", "dessert"],
    planted: "2026-10-15",
    tended: "2026-10-15",
    body: `Rich, gooey brownies with simple ingredients. 🍫

## Ingredients

- ½ cup (115 g) butter
- 1 cup (200 g) sugar
- 2 eggs
- 1 tsp vanilla
- ½ cup (50 g) cocoa powder
- ½ cup (65 g) flour
- ¼ tsp salt
- ½ cup chocolate chips or chopped chocolate — optional

## Method

1. Heat oven to 175°C. Grease or line a small 8×8-inch / 20 cm square pan.
2. Melt the butter, then stir in the sugar.
3. Add eggs and vanilla and whisk until smooth and slightly glossy.
4. Stir in cocoa powder, flour and salt just until combined. Don't overmix.
5. Fold in chocolate if using.
6. Spread into the pan and bake for 20–25 minutes.
7. Take them out when the edges are set but the centre still looks slightly soft. A toothpick should come out with moist crumbs, not completely clean.
8. Cool for at least 15–20 minutes before cutting.

> **For really fudgy brownies:** aim closer to 20–22 minutes. The biggest mistake is baking until the toothpick is completely dry — that usually gives you cakier brownies.

Baking a big batch for orders? See the [[Busy baker's to-do list]].`
  },
  {
    title: "Busy baker's to-do list",
    stage: "budding",
    tags: ["baking", "business", "checklist"],
    planted: "2026-10-15",
    tended: "2026-10-15",
    body: `A daily checklist to keep a baking day on track. 🍰

## Morning

- [ ] Check today's orders and deadlines
- [ ] Confirm pickups/deliveries
- [ ] Check ingredient and packaging stock
- [ ] Prep ingredients and preheat ovens
- [ ] Start longest bake first

## Baking & decorating

- [ ] Bake cakes, [[Easy fudgy brownies|brownies]], cookies, etc.
- [ ] Prepare fillings, frosting and toppings
- [ ] Cool baked goods
- [ ] Decorate orders
- [ ] Add names/messages/custom details
- [ ] Photograph finished orders
- [ ] Package and label everything

## Orders & business

- [ ] Reply to customer messages
- [ ] Confirm new orders and payments
- [ ] Update order calendar
- [ ] Post/update social media
- [ ] Record today's expenses and sales

## Before closing

- [ ] Complete pickups/deliveries
- [ ] Clean counters, equipment and oven area
- [ ] Wash and put away tools
- [ ] Restock low ingredients
- [ ] Prep anything needed for tomorrow
- [ ] Review tomorrow's orders`
  }
];
