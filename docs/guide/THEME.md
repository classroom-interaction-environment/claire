# CLAIRE Theme guide

CLAIRE allows custom themes to be added. This guide provides general guidance on styling and rules to follow in order
to get decent results.

## How to include a custom theme

There are two ways to include a custom theme. One is via the Administrator-settings page, where you can insert the
compiled css theme and save it to the DB. 
This is good for end-users and school administrators to apply a custom theme that complies with the institution's theme.

The other option is to use a custom theme in the code. Currently you need to replace the theme files, while in the
future there will be a plugin interface to provide your custom theme using an external package.

## Bootstrap theme concept

We currently use Bootstrap for our layouts and component styles. Bootstrap comes with a few concepts that shape the
way our UI looks and behaves:

- [layout- and grid system](https://getbootstrap.com/docs/4.6/layout/overview/)
- [flexbox utilities](https://getbootstrap.com/docs/4.6/utilities/flex/)
- [modals for dialogs](https://getbootstrap.com/docs/4.6/components/modal/)
- [tooltips on hover](https://getbootstrap.com/docs/4.6/components/tooltips/)

## Colors

We mainly follow the Bootstrap [color schema](https://getbootstrap.com/docs/4.6/utilities/colors/) and map them to our
actions:

- `primary` - the main color in CLAIRE, by default used in the navbar headlines and buttons with primary actions
- `secondary` - the secondary color, used in general actions and some texts
- `success` - indicates a success (document successfully created) but also for "new" or "create" actions
- `warning` - 
- `danger` - indicates errors and problems but also used for `remove` and `delete` actions
- `light` - used as `mute` or `disabled` color but also a the main background
- `dark` - 
- `grey` - background color for components and panels (card, lists etc.)

You are not forced to follow this when creating a new theme but keep in mind, that these color classes are assigned
to components and will apply whatever you define for them.

## Buttons

All Buttons are `primary` by default, except those for the following action types:

| Action | Color |
|--------|-------|
| create | `success` |
| delete | `danger` |
| remove | `danger` |
| add/select | `secondary` |
| cancel | `secondary` |
| invite | `secondary` |
| start | `success` |
| complete | `secondary` |

All buttons are filled, except those in list-view, which are outlined only.
