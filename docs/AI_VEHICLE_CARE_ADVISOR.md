# AquaLux Explainable AI Vehicle Care Advisor

## Purpose

The advisor helps a customer or staff member choose an official AquaLux wash
package and understand expected service demand. It is decision support, not an
automatic diagnosis and not a replacement for staff inspection.

## Inputs

- Vehicle type: Motorcycle, Car, Van or SUV
- Dirt level: Light, Medium or Heavy
- Interior cleaning requirement
- Special condition such as mud, salt, pet hair or stains
- Days since the previous wash
- Usage pattern: Low, Normal or Heavy
- Optional budget
- Preferred service date

## Condition score

The Flask backend calculates a transparent 0–100 score from the submitted
condition inputs. Dirt, interior needs, special conditions, wash age and usage
each contribute known points. The final value is limited to the 0–100 range and
is returned with a condition level, urgency and maintenance advice.

This score is a rule-based service-priority indicator. It is not a mechanical
vehicle-health diagnosis.

## Package recommendation

The recommended package comes from the shared SQLite service catalogue. The
advisor returns the same package name, price and duration used by the Home page,
bookings, payments, receipts and reports. It also returns human-readable reasons
showing which customer inputs influenced the result.

A budget never silently changes the official price. When the budget is lower
than the catalogue price, the advisor explains the difference and keeps the
official amount.

## Demand and waiting-time forecast

The forecast groups stored bookings by weekday and estimates demand for the
preferred date. It reports:

- Expected bookings
- Low, moderate, high or closed demand
- Estimated waiting time
- Historical sample size
- Data-quality label: Early, Growing or Established
- A quieter alternative day when available

Sunday is always returned as closed. The estimate is historical and descriptive;
it is not labelled as trained machine learning.

## Feedback and monitoring

Authenticated customers can record whether a recommendation was helpful. Each
feedback record is linked to the originating AI request and stored in SQLite.
The admin AI Insights page reports usage, feedback coverage, weekday demand,
vehicle activity and data readiness.

No accuracy percentage is displayed without a labelled evaluation dataset.
The dashboard explicitly returns `accuracy: null` until accuracy can be measured
honestly against confirmed outcomes.

## Responsible-use controls

- Authentication and role checks protect AI and admin endpoints.
- Feedback ownership is validated server-side.
- User-facing content is escaped before rendering.
- Official package prices remain catalogue-controlled.
- Forecast method, sample size and limitations are visible.
- Staff inspection is recommended before service begins.
