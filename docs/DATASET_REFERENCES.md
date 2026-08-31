# AquaLux Dataset Sources and Online References

## AI-Assisted Vehicle Wash Center Management System

This document explains where the data used in the AquaLux project came from and the online references I used when deciding the vehicle categories, wash-service fields, AI inputs and future evaluation approach.

> **Important note:** The current AquaLux system does not download or copy a ready-made training dataset from the internet. The records inside the project database were created for system development, demonstration and testing, and new records are added when the system is used. The AI Vehicle Care Advisor currently uses transparent rules and the demand feature uses historical AquaLux booking records. Therefore, I do not claim that the current project contains a trained machine-learning model.

## 1. Dataset Used in the Project

The main data store is the SQLite database located at `data/aqualux.db`. JSON files in the `data` folder are also used as project data/sample records.

The project contains the following main groups of data:

| Data group | Example fields | How it was obtained | Main use |
|---|---|---|---|
| Customers | name, phone, email, city/address | Project-created demo records and records entered through the system | Customer management and testing |
| Vehicles | vehicle number, vehicle type, owner | Project-created demo records and records entered through the system | Vehicle and booking management |
| Packages | package name, vehicle type, price, duration | AquaLux project catalogue created for the prototype | Booking, payment and recommendation consistency |
| Bookings | customer, vehicle, package, date, time, status | Project-created test records plus records created by users | Booking management and demand estimation |
| Payments | booking, amount, discount, method, status | Generated from completed bookings | Payments, receipts and reports |
| AI requests | vehicle type and submitted care inputs | Generated when authenticated users use the AI advisor | AI usage history |
| AI feedback | helpful/not helpful, comment | Entered by customers after an AI recommendation | Future evaluation and monitoring |

The demo records are **synthetic/project-created data**. They are not presented as real customer records collected from an external company. NIST describes synthetic data generation as creating artificial data from seed information while keeping selected characteristics of the source data. This supports the general terminology used in this project, although the AquaLux demo records are simple student-created records rather than a formal privacy-preserving synthetic-data product.

## 2. Why Online References Were Used

The online references were not copied row-by-row into the AquaLux database. I used them as supporting evidence when designing realistic fields and categories for a Sri Lankan vehicle wash-center prototype.

### 2.1 Department of Motor Traffic Sri Lanka

The Department of Motor Traffic publishes official Sri Lankan vehicle statistics and includes categories such as motor cars, motor cycles and dual-purpose vehicles. I used this source to support the decision to make the system work with more than one vehicle category rather than creating a car-only system.

**Reference:** Department of Motor Traffic Sri Lanka. *Statistics*.  
https://dmt.gov.lk/index.php?Itemid=132&id=16&lang=en&option=com_content&view=article

A historical DMT vehicle-population table can also be used as supporting evidence for the presence of different vehicle classes in Sri Lanka:

https://www.dmt.gov.lk/images/PDF/statistics/TOTAL_VEHICLE_POPULATION_2010-2022.pdf

**How it influenced AquaLux:**
- Supports the use of multiple vehicle categories.
- Supports the Sri Lankan context of the project.
- It was **not** used to generate individual AquaLux customers, booking dates or payment values.

### 2.2 Auto Miraj Sri Lanka

Auto Miraj publicly lists vehicle wash, grooming and detailing services and provides appointment-related fields such as vehicle type, vehicle number, service and date/time. This was useful as a local example showing that digital appointment and vehicle-care workflows are practical in Sri Lanka.

**References:**  
Auto Miraj. *Services - Best Car Wash Services*.  
https://automiraj.lk/services-best-car-wash-services/

Auto Miraj. *Contact Us / Appointment Form*.  
https://automiraj.lk/contact-us/

**How it influenced AquaLux:**
- Supported the wash-package concept.
- Supported the use of vehicle and appointment information in a booking workflow.
- Helped confirm that wash and grooming are legitimate standalone service categories.
- AquaLux prices and durations are still project-specific prototype values.

### 2.3 LAUGFS Car Care Sri Lanka

LAUGFS Car Care publishes vehicle wash packages such as Quick Wash and Detailed Wash. Its Detailed Wash description includes body wash, carpet wash, glass cleaning, dashboard cleaning, tyre dressing, waxing and interior vacuuming.

**Reference:** LAUGFS Car Care. *Vehicle Wash Packages*.  
https://www.laugfscarcare.lk/car-wash

**How it influenced AquaLux:**
- Supported the idea of different levels of washing service.
- Supported using interior-cleaning need as one of the AI care inputs.
- Supported a package-based service catalogue rather than one fixed wash option.
- The source was not used as a direct training dataset.

### 2.4 U.S. Environmental Protection Agency

The U.S. EPA recommends responsible vehicle-washing practices, including use of commercial car washes and reducing polluted runoff. I used this only as general background for responsible vehicle-washing practice.

**Reference:** U.S. Environmental Protection Agency. *What You Can Do: In Your Home - Washing Your Car*.  
https://www.epa.gov/nutrientpollution/what-you-can-do-your-home

**How it influenced AquaLux:**
- Supports the general environmental context of professional vehicle washing.
- It does not determine AquaLux package prices, condition scores or customer data.

## 3. AI Data Used by the Current System

The current AI advisor accepts inputs such as:

- vehicle type;
- dirt level;
- whether interior cleaning is required;
- special conditions such as mud, water spots or stains;
- days since the previous wash;
- usage pattern;
- customer budget; and
- preferred service date.

The system calculates a transparent 0-100 care score using programmed rules. This score is a **service-priority indicator**, not a mechanical diagnosis and not the output of a trained classifier.

The demand feature works differently. It reads AquaLux booking dates from SQLite, groups the existing bookings by weekday and estimates expected demand and waiting time from that stored history. This means the prediction becomes more useful as genuine system booking records are accumulated.

## 4. Difference Between Demo Data and Real Operational Data

I separated these concepts because they are important for the project report and viva.

### Demo / synthetic project data

This was created to make it possible to develop and test the application before a real business dataset was available. It includes sample customers, vehicles, bookings and payments. Names and records should be treated as prototype data.

### Operational data

When the application is used, new customers, vehicles, bookings, payments, AI requests and feedback are saved in SQLite. These records can later provide a more realistic basis for analysing demand and evaluating recommendations.

### External reference data

The websites listed in this document provide context and evidence. They are **references**, not hidden sources of AquaLux customer data.

## 5. Training Dataset Status

At the current project stage there is **no separately downloaded machine-learning training dataset and no claim that a machine-learning model was trained on the demo customer records**.

This is intentional. The present implementation follows a student-level explainable approach:

1. Rules are used for vehicle-care scoring and package advice.
2. Stored AquaLux bookings are used for the historical weekday demand estimate.
3. Customer helpful/not-helpful feedback is collected for future evaluation.
4. The admin AI dashboard does not invent an accuracy percentage when a labelled evaluation dataset is not available.

This makes the implementation easier to explain and avoids reporting a false model accuracy.

## 6. If Machine Learning Is Added Later

If enough labelled AquaLux data is collected later, a separate model can be trained and tested. The dataset should be divided into training and evaluation data, and performance should be checked on unseen records rather than reporting training performance only.

The official scikit-learn documentation explains that fitting a model does not prove it will predict well on unseen data and recommends evaluation methods such as train/test splitting and cross-validation.

**References:**

scikit-learn. *Getting Started - Model evaluation*.  
https://scikit-learn.org/stable/getting_started.html

scikit-learn. *Model selection and evaluation*.  
https://scikit-learn.org/stable/model_selection.html

scikit-learn. *Metrics and scoring*.  
https://scikit-learn.org/stable/api/sklearn.metrics.html

If a CSV dataset is created later, pandas can be used to load and clean the file before modelling.

**Reference:** pandas. *pandas.read_csv documentation*.  
https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html

## 7. Data Quality and Limitations

The current dataset has limitations that should be stated clearly:

- demo records are created for development and are not a representative sample of all Sri Lankan vehicle-wash customers;
- the number of historical bookings is small compared with a production business;
- busy-day estimates can change as more bookings are added;
- customer-entered information can contain errors;
- AI helpful/not-helpful feedback is subjective;
- the four AquaLux vehicle categories are application categories and are not intended to reproduce the exact legal classification system used by the Department of Motor Traffic;
- external service websites support the design context but do not validate AquaLux's exact prices or scoring weights.

Because of these limitations, the current AI result is described as explainable decision support rather than a scientifically validated diagnostic or high-accuracy predictive model.

## 8. Reference List

1. Department of Motor Traffic Sri Lanka (2026) *Statistics*. Available at: https://dmt.gov.lk/index.php?Itemid=132&id=16&lang=en&option=com_content&view=article (Accessed: 31 August 2026).
2. Department of Motor Traffic Sri Lanka, *Total Vehicle Population / New Registration statistics*. Available at: https://www.dmt.gov.lk/images/PDF/statistics/TOTAL_VEHICLE_POPULATION_2010-2022.pdf (Accessed: 31 August 2026).
3. Auto Miraj, *Services - Best Car Wash Services*. Available at: https://automiraj.lk/services-best-car-wash-services/ (Accessed: 31 August 2026).
4. Auto Miraj, *Contact Us / Appointment Form*. Available at: https://automiraj.lk/contact-us/ (Accessed: 31 August 2026).
5. LAUGFS Car Care, *Vehicle Wash Packages*. Available at: https://www.laugfscarcare.lk/car-wash (Accessed: 31 August 2026).
6. U.S. Environmental Protection Agency, *What You Can Do: In Your Home - Washing Your Car*. Available at: https://www.epa.gov/nutrientpollution/what-you-can-do-your-home (Accessed: 31 August 2026).
7. National Institute of Standards and Technology, *Synthetic Data Generation - Glossary*. Available at: https://csrc.nist.gov/glossary/term/synthetic_data_generation (Accessed: 31 August 2026).
8. scikit-learn, *Getting Started - Model evaluation*. Available at: https://scikit-learn.org/stable/getting_started.html (Accessed: 31 August 2026).
9. scikit-learn, *Model selection and evaluation*. Available at: https://scikit-learn.org/stable/model_selection.html (Accessed: 31 August 2026).
10. scikit-learn, *Metrics and scoring*. Available at: https://scikit-learn.org/stable/api/sklearn.metrics.html (Accessed: 31 August 2026).
11. pandas, *pandas.read_csv*. Available at: https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html (Accessed: 31 August 2026).

## 9. Short Statement for the Viva

I did not download a hidden dataset and claim it as my own. I created sample records to develop and test the AquaLux system, and the application then stores its own bookings and AI feedback in SQLite. The online sources were used to support realistic vehicle and wash-service concepts. The current recommendation engine is rule-based, while demand is estimated from historical AquaLux bookings. If I collect enough labelled data in the future, I can train and evaluate a machine-learning model separately.
