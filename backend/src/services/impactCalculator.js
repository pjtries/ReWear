/**
 * Personal Sustainability Impact & Circular Earnings Calculator
 * Calculates cumulative Water Saved (Liters), Carbon Emissions Avoided (kg CO2e),
 * Energy Saved (kWh), and Rental Earnings across completed/active rentals
 * for a user acting as BOTH a Lender and a Borrower.
 *
 * Ecological Benchmark per Rental Cycle vs. Fast-Fashion Virgin Production:
 * - Water Saved:From lifecycle_events or 2,700 L baseline per full outfit rental cycle
 * - Carbon Avoided: From lifecycle_events or 15.2 kg CO2e baseline per rental cycle
 * - Energy Saved: ~2.15 kWh per kg CO2e avoided (32.8 kWh per full outfit rental cycle)
 */
export function calculateUserImpact(userId, store) {
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;

  // All bookings where the user participated as LENDER or BORROWER (excluding CANCELLED)
  const asLenderBookings = store.bookings.filter(
    (b) => b.lender_id === userId && b.booking_status !== 'CANCELLED'
  );
  const asBorrowerBookings = store.bookings.filter(
    (b) => b.borrower_id === userId && b.booking_status !== 'CANCELLED'
  );

  const completedAsLender = asLenderBookings.filter((b) =>
    ['COMPLETED', 'ACTIVE', 'RETURNED', 'HANDED_OVER'].includes(b.booking_status)
  );
  const completedAsBorrower = asBorrowerBookings.filter((b) =>
    ['COMPLETED', 'ACTIVE', 'RETURNED', 'HANDED_OVER'].includes(b.booking_status)
  );

  // Owned garments
  const ownedGarments = store.garments.filter((g) => g.owner_id === userId);
  const ownedGarmentIds = new Set(ownedGarments.map((g) => g.id));

  // Lifecycle events on garments owned by this user
  const lenderLifecycleEvents = store.lifecycle_events.filter((ev) =>
    ownedGarmentIds.has(ev.garment_id)
  );

  // Sum ecological savings from lender's garment lifecycle events
  let lenderWaterLiters = lenderLifecycleEvents.reduce(
    (sum, ev) => sum + Number(ev.estimated_water_saved_liters || 0),
    0
  );
  let lenderCo2Kg = lenderLifecycleEvents.reduce(
    (sum, ev) => sum + Number(ev.estimated_co2_saved_kg || 0),
    0
  );

  // Ensure every completed/active lender booking contributes at least baseline if event wasn't separately logged
  if (lenderWaterLiters === 0 && completedAsLender.length > 0) {
    lenderWaterLiters = completedAsLender.length * 2700;
    lenderCo2Kg = completedAsLender.length * 15.2;
  }

  // Sum ecological savings from borrower's rentals
  let borrowerWaterLiters = 0;
  let borrowerCo2Kg = 0;
  for (const b of completedAsBorrower) {
    const garmentEvents = store.lifecycle_events.filter(
      (ev) => ev.garment_id === b.garment_id && ev.event_type === 'RENTED'
    );
    if (garmentEvents.length > 0) {
      borrowerWaterLiters += Number(garmentEvents[0].estimated_water_saved_liters || 2600);
      borrowerCo2Kg += Number(garmentEvents[0].estimated_co2_saved_kg || 14.5);
    } else {
      borrowerWaterLiters += 2600;
      borrowerCo2Kg += 14.5;
    }
  }

  const totalWaterSavedLiters = Math.round(lenderWaterLiters + borrowerWaterLiters);
  const totalCo2SavedKg = Number((lenderCo2Kg + borrowerCo2Kg).toFixed(2));
  // Energy Saved (kWh): Textile manufacturing consumes ~2.18 kWh per kg CO2e emitted
  const totalEnergySavedKwh = Number((totalCo2SavedKg * 2.18).toFixed(1));

  // Calculate gross & net rental earnings as a Lender
  const grossLenderEarnings = completedAsLender.reduce(
    (sum, b) => sum + Number(b.rental_amount || 0),
    0
  );
  const totalPlatformFees = completedAsLender.reduce(
    (sum, b) => sum + Number(b.platform_fee || 0),
    0
  );
  const netLenderEarnings = Number((grossLenderEarnings - totalPlatformFees).toFixed(2));

  // Calculate borrower savings compared to buying retail MRP
  const retailSpendAvoided = completedAsBorrower.reduce((sum, b) => {
    const g = store.garments.find((item) => item.id === b.garment_id);
    return sum + (g ? Number(g.retail_value) - Number(b.rental_amount) : 12000);
  }, 0);

  return {
    user_id: user.id,
    full_name: user.full_name,
    campus_or_area: user.campus_or_area,
    kyc_status: user.kyc_status,
    metrics: {
      water_saved_liters: totalWaterSavedLiters,
      carbon_avoided_kg_co2e: totalCo2SavedKg,
      energy_saved_kwh: totalEnergySavedKwh,
      equivalent_drinking_water_days: Math.round(totalWaterSavedLiters / 3),
      equivalent_smartphone_charges: Math.round(totalEnergySavedKwh * 85),
      equivalent_trees_planted_year: Number((totalCo2SavedKg / 21).toFixed(1))
    },
    breakdown: {
      as_lender: {
        rentals_hosted: completedAsLender.length,
        water_saved_liters: Math.round(lenderWaterLiters),
        carbon_avoided_kg_co2e: Number(lenderCo2Kg.toFixed(2)),
        energy_saved_kwh: Number((lenderCo2Kg * 2.18).toFixed(1)),
        gross_rental_earnings_inr: grossLenderEarnings,
        net_rental_earnings_inr: netLenderEarnings
      },
      as_borrower: {
        rentals_completed: completedAsBorrower.length,
        water_saved_liters: Math.round(borrowerWaterLiters),
        carbon_avoided_kg_co2e: Number(borrowerCo2Kg.toFixed(2)),
        energy_saved_kwh: Number((borrowerCo2Kg * 2.18).toFixed(1)),
        retail_spend_avoided_inr: Math.max(0, Math.round(retailSpendAvoided))
      }
    }
  };
}
