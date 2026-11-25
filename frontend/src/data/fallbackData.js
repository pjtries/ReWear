export const INITIAL_USERS = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    full_name: 'Ananya Rao',
    email: 'ananya.rao.cse26@dsu.edu.in',
    phone: '+91-9845011201',
    campus_or_area: 'Dayananda Sagar University (Harohalli Main Campus)',
    kyc_status: 'AADHAAR_KYC_VERIFIED',
    kyc_reference_token: 'DIGILOCKER_TKN_8F9A2C1D7E4B_DSU26',
    lender_rating: 4.95,
    borrower_rating: 4.9,
    total_reviews: 18
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    full_name: 'Rohan Kulkarni',
    email: 'rohan.kulkarni.mba@dsu.edu.in',
    phone: '+91-9845011202',
    campus_or_area: 'Dayananda Sagar University (City Innovation Campus, Kudlu Gate)',
    kyc_status: 'STUDENT_VERIFIED',
    kyc_reference_token: 'DSU_ID_ENG24MBA089_VERIFIED',
    lender_rating: 4.82,
    borrower_rating: 4.88,
    total_reviews: 12
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    full_name: 'Meghana Gowda',
    email: 'meghana.gowda@dsu.edu.in',
    phone: '+91-9845011203',
    campus_or_area: 'Kumaraswamy Layout (DSCE / DSU Hub)',
    kyc_status: 'AADHAAR_KYC_VERIFIED',
    kyc_reference_token: 'DIGILOCKER_TKN_3B7E91A4C2D0_BLR',
    lender_rating: 5.0,
    borrower_rating: 4.95,
    total_reviews: 24
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    full_name: 'Siddharth Menon',
    email: 'siddharth.menon.ece@dsu.edu.in',
    phone: '+91-9845011204',
    campus_or_area: 'Dayananda Sagar University (Harohalli Main Campus)',
    kyc_status: 'STUDENT_VERIFIED',
    kyc_reference_token: 'DSU_ID_ENG23ECE142_VERIFIED',
    lender_rating: 4.75,
    borrower_rating: 4.65,
    total_reviews: 9
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    full_name: 'Divya Hegde',
    email: 'divya.hegde.design@gmail.com',
    phone: '+91-9845011205',
    campus_or_area: 'Jayanagar 4th Block, Bengaluru',
    kyc_status: 'AADHAAR_KYC_VERIFIED',
    kyc_reference_token: 'DIGILOCKER_TKN_9D4C8A2E6F11_BLR',
    lender_rating: 4.92,
    borrower_rating: 5.0,
    total_reviews: 15
  }
];

export const INITIAL_GARMENTS = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    owner_id: '11111111-1111-4111-8111-111111111101',
    title: 'Sabyasachi-Inspired Emerald Silk Organza Lehenga Set',
    description:
      'Hand-embroidered zardozi & gota patti emerald lehenga with sequin tulle dupatta. Worn once for a cousin’s reception at Palace Grounds. Ideal for college ethnic night headliners or Bengaluru wedding guests.',
    category: 'Lehenga',
    primary_color: 'Emerald Green',
    secondary_color: 'Antique Gold',
    pattern: 'Embroidered',
    style_tags: ['Zardozi Handwork', 'Organza Silk', 'Bridal Reception', 'Heritage Couture'],
    condition_grade: 'LIKE_NEW',
    occasion: 'Wedding',
    size: 'M',
    brand: 'Kalki Fashion Mumbai',
    retail_value: 28500,
    daily_rental_price: 1650,
    suggested_price: 1700,
    security_deposit: 4500,
    luxury_tier: 'HIGH_VALUE_CONCIERGE',
    care_instructions:
      'Strictly professional hydrocarbon dry-clean only. Do not iron directly on zardozi work; steam from reverse side.',
    location_tag: 'DSU Harohalli Hostel Block B / Kanakapura Road',
    status: 'AVAILABLE',
    owner: INITIAL_USERS[0],
    images: [
      {
        id: '301',
        image_url:
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      },
      {
        id: '302',
        image_url:
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
        display_order: 2
      }
    ],
    bookings: [
      {
        id: '44444444-4444-4444-8444-444444444401',
        start_date: '2026-11-10',
        end_date: '2026-11-12',
        buffer_end_date: '2026-11-14',
        booking_status: 'COMPLETED'
      }
    ],
    lifecycle_events: [
      {
        id: '701',
        event_type: 'LISTED',
        description: 'Onboarded to ReWear Circular Wardrobe at DSU Harohalli Campus with digital twin tag #RW-902.',
        partner_name: 'ReWear Campus Hub - DSU',
        estimated_water_saved_liters: 0,
        estimated_co2_saved_kg: 0,
        event_date: '2026-10-01T10:00:00.000Z'
      },
      {
        id: '702',
        event_type: 'RENTED',
        description: 'Rented by Meghana Gowda for 3-day Wedding Reception in Bengaluru instead of buying new occasion wear.',
        partner_name: 'ReWear Concierge Logistics',
        estimated_water_saved_liters: 3400,
        estimated_co2_saved_kg: 18.5,
        event_date: '2026-11-10T09:00:00.000Z'
      },
      {
        id: '703',
        event_type: 'CLEANED',
        description: 'Eco-solvent hydrocarbon dry cleaning and ozone sanitization completed during 2-day buffer window.',
        partner_name: 'GreenSteam Eco Dry Cleaners, Kanakapura Road',
        estimated_water_saved_liters: 180,
        estimated_co2_saved_kg: 1.4,
        event_date: '2026-11-13T16:00:00.000Z'
      }
    ]
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    owner_id: '11111111-1111-4111-8111-111111111102',
    title: 'Charcoal Peak-Lapel Double Breasted Tuxedo Suit (3-Piece)',
    description:
      'Tailored Italian wool-blend tuxedo with satin lapel trim, waistcoat, and flat-front trousers. Perfect for DSU MBA Convocation, Placement Gala, or IEEE Annual Banquet.',
    category: 'Blazer',
    primary_color: 'Charcoal Black',
    secondary_color: 'Ivory White',
    pattern: 'Solid',
    style_tags: ['Peak Lapel', 'Italian Wool', 'Convocation Suit', 'Black Tie'],
    condition_grade: 'LIKE_NEW',
    occasion: 'Formal',
    size: 'L',
    brand: 'Raymond Made to Measure',
    retail_value: 19800,
    daily_rental_price: 1100,
    suggested_price: 1150,
    security_deposit: 3000,
    luxury_tier: 'HIGH_VALUE_CONCIERGE',
    care_instructions: 'Keep in breathable garment bag provided. Dry clean after every 2 wears via partner laundry.',
    location_tag: 'DSU Kudlu Gate Innovation Campus / HSR Sector 2',
    status: 'AVAILABLE',
    owner: INITIAL_USERS[1],
    images: [
      {
        id: '303',
        image_url:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      }
    ],
    bookings: [
      {
        id: '44444444-4444-4444-8444-444444444404',
        start_date: '2026-12-02',
        end_date: '2026-12-04',
        buffer_end_date: '2026-12-06',
        booking_status: 'APPROVED'
      }
    ],
    lifecycle_events: [
      {
        id: '707',
        event_type: 'RENTED',
        description: 'Completed 4 campus formal rentals across DSU Kudlu Gate MBA & Engineering cohorts.',
        partner_name: 'FabCare Express, HSR Layout',
        estimated_water_saved_liters: 4800,
        estimated_co2_saved_kg: 26.4,
        event_date: '2026-11-02T14:00:00.000Z'
      }
    ]
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    owner_id: '11111111-1111-4111-8111-111111111103',
    title: 'Mysore Crepe Silk Zari Saree & Brocade Kurta Blouse Set',
    description:
      'Authentic KSIC Mysore Silk ensemble in terracotta crimson and antique gold zari, paired with a designer brocade readymade blouse (34-36 adjustable). Lightweight and effortless for Ethnic Day.',
    category: 'Kurta Set',
    primary_color: 'Terracotta Red',
    secondary_color: 'Antique Gold',
    pattern: 'Floral',
    style_tags: ['KSIC Pure Silk', 'Temple Zari Border', 'Kannada Rajyotsava', 'Heritage Drape'],
    condition_grade: 'NEW_WITH_TAGS',
    occasion: 'Ethnic',
    size: 'Free Size',
    brand: 'KSIC Mysore Silk',
    retail_value: 16500,
    daily_rental_price: 780,
    suggested_price: 800,
    security_deposit: 2200,
    luxury_tier: 'HIGH_VALUE_CONCIERGE',
    care_instructions: 'Do not spray perfume directly on pure gold zari. Fold in muslin cloth after airing in shade.',
    location_tag: 'Kumaraswamy Layout Stage 1 (Near DSCE Gate 2)',
    status: 'RENTED',
    owner: INITIAL_USERS[2],
    images: [
      {
        id: '304',
        image_url:
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      }
    ],
    bookings: [
      {
        id: '44444444-4444-4444-8444-444444444402',
        start_date: '2026-11-24',
        end_date: '2026-11-26',
        buffer_end_date: '2026-11-28',
        booking_status: 'ACTIVE'
      }
    ],
    lifecycle_events: [
      {
        id: '705',
        event_type: 'RENTED',
        description: 'Rented for DSU Kannada Rajyotsava & Ethnic Fest.',
        partner_name: 'DSU Campus Meetup Zone',
        estimated_water_saved_liters: 2600,
        estimated_co2_saved_kg: 14.2,
        event_date: '2026-11-24T09:30:00.000Z'
      }
    ]
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    owner_id: '11111111-1111-4111-8111-111111111104',
    title: 'Ivory Chikankari & Mirror-Work Bandhgala Sherwani Set',
    description:
      'Lucknowi hand-embroidered ivory raw silk Bandhgala sherwani jacket with subtle mirror highlights and tapered breeches. Huge crowd favorite for cultural fests and sangeet nights.',
    category: 'Sherwani',
    primary_color: 'Ivory Cream',
    secondary_color: 'Silver Mirror',
    pattern: 'Embroidered',
    style_tags: ['Lucknowi Chikankari', 'Mirror Work', 'Bandhgala Jodhpuri', 'Festive Menswear'],
    condition_grade: 'LIKE_NEW',
    occasion: 'College Event',
    size: 'M',
    brand: 'Manyavar Mohey',
    retail_value: 12499,
    daily_rental_price: 650,
    suggested_price: 625,
    security_deposit: 1800,
    luxury_tier: 'HIGH_VALUE_CONCIERGE',
    care_instructions: 'Gentle steam press only. Check mirror thread fastness before packing.',
    location_tag: 'DSU Harohalli Academic Block C',
    status: 'AVAILABLE',
    owner: INITIAL_USERS[3],
    images: [
      {
        id: '305',
        image_url:
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      }
    ],
    bookings: [],
    lifecycle_events: []
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    owner_id: '11111111-1111-4111-8111-111111111105',
    title: 'Corset Draped Champagne Satin Gown with Detachable Cape',
    description:
      'Editorial structured boned corset gown in champagne liquid satin. Features an ankle slit and sheer organza shoulder cape. Ideal for Freshers Eve, Fashion Show walk, or cocktail sundowners.',
    category: 'Gown',
    primary_color: 'Champagne Gold',
    secondary_color: 'Pearl Nude',
    pattern: 'Sequined',
    style_tags: ['Boned Corset', 'Liquid Satin', 'Organza Cape', 'Freshers Gala'],
    condition_grade: 'GENTLY_WORN',
    occasion: 'Party',
    size: 'S',
    brand: 'House of Fett',
    retail_value: 9800,
    daily_rental_price: 540,
    suggested_price: 550,
    security_deposit: 1500,
    luxury_tier: 'HIGH_VALUE_CONCIERGE',
    care_instructions: 'Use silicon heel protectors to avoid hem snagging. Spot clean spills immediately.',
    location_tag: 'Jayanagar 4th Block / JP Nagar Metro',
    status: 'IN_CLEANING',
    owner: INITIAL_USERS[4],
    images: [
      {
        id: '306',
        image_url:
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      }
    ],
    bookings: [],
    lifecycle_events: [
      {
        id: '706',
        event_type: 'REPAIRED',
        description: 'Scheduled concealed zipper slider alignment & satin hem spot treatment.',
        partner_name: 'StitchCraft Master Tailors, Jayanagar',
        estimated_water_saved_liters: 1950,
        estimated_co2_saved_kg: 11.8,
        event_date: '2026-11-21T11:30:00.000Z'
      }
    ]
  },
  {
    id: '22222222-2222-4222-8222-222222222206',
    owner_id: '11111111-1111-4111-8111-111111111101',
    title: 'Oversized Indigo Hand-Block Ajrakh Streetwear Co-ord',
    description:
      'Sustainable organic cotton Ajrakh hand-block printed oversized jacket with wide-leg cargo trousers. Worn at Bangalore Fashion Week sustainable showcase.',
    category: 'Streetwear',
    primary_color: 'Indigo Blue',
    secondary_color: 'Slate Teal',
    pattern: 'Printed',
    style_tags: ['Ajrakh Hand-Block', 'Organic Cotton', 'Oversized Fit', 'Campus Concert'],
    condition_grade: 'LIKE_NEW',
    occasion: 'College Event',
    size: 'XS',
    brand: 'Nicobar Studio',
    retail_value: 4500,
    daily_rental_price: 290,
    suggested_price: 280,
    security_deposit: 700,
    luxury_tier: 'STANDARD',
    care_instructions: 'Natural indigo dye—keep away from harsh bleach. Cold gentle wash or eco dry clean.',
    location_tag: 'DSU Harohalli Main Campus',
    status: 'AVAILABLE',
    owner: INITIAL_USERS[0],
    images: [
      {
        id: '307',
        image_url:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      }
    ],
    bookings: [],
    lifecycle_events: []
  },
  {
    id: '22222222-2222-4222-8222-222222222207',
    owner_id: '11111111-1111-4111-8111-111111111103',
    title: 'Anita Dongre Grassroot Regal Teal Bandhani Lehenga Set',
    description:
      'Crafted by artisans in Bhuj, this teal handwoven silk-cotton Bandhani ensemble comes with antiqued silver gota work and churidar.',
    category: 'Lehenga',
    primary_color: 'Slate Teal',
    secondary_color: 'Silver Gota',
    pattern: 'Embroidered',
    style_tags: ['Bhuj Bandhani', 'Artisanal Handloom', 'Silver Gota Patti', 'Sustainable Luxury'],
    condition_grade: 'NEW_WITH_TAGS',
    occasion: 'Wedding',
    size: 'XL',
    brand: 'Anita Dongre Grassroot',
    retail_value: 34000,
    daily_rental_price: 1950,
    suggested_price: 2000,
    security_deposit: 5000,
    luxury_tier: 'HIGH_VALUE_CONCIERGE',
    care_instructions: 'Concierge pickup mandatory. Packaged in acid-free tissue box.',
    location_tag: 'Kumaraswamy Layout / Banashankari 2nd Stage',
    status: 'AVAILABLE',
    owner: INITIAL_USERS[2],
    images: [
      {
        id: '308',
        image_url:
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
        display_order: 1
      }
    ],
    bookings: [],
    lifecycle_events: []
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: '44444444-4444-4444-8444-444444444402',
    garment_id: '22222222-2222-4222-8222-222222222203',
    borrower_id: '11111111-1111-4111-8111-111111111101',
    lender_id: '11111111-1111-4111-8111-111111111103',
    start_date: '2026-11-24',
    end_date: '2026-11-26',
    buffer_end_date: '2026-11-27',
    handoff_mode: 'P2P_MEETUP',
    rental_amount: 1560,
    platform_fee: 156,
    pickup_fee: 0,
    deposit_amount: 2200,
    payment_status: 'ESCROW_HELD',
    booking_status: 'ACTIVE',
    inspection_qr_token: 'RWQR-44444402-22222203-7C3B1E9F4A2D02',
    garment: INITIAL_GARMENTS[2],
    borrower: INITIAL_USERS[0],
    lender: INITIAL_USERS[2],
    condition_logs: [
      {
        id: '503',
        stage: 'PRE_HANDOFF',
        device_id: 'ESP32-CAM-KUMARASWAMY-HUB-02',
        led_lux_level: 850,
        condition_score: 99,
        detected_defects: [],
        photo_urls: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'
        ],
        checklist_json: {
          stains: false,
          tears: false,
          buttons_zippers: false,
          odor: false,
          missing_items: false
        },
        notes: 'Handed over at Kumaraswamy Layout Metro Gate B. Zari border and blouse hooks inspected together.',
        created_at: '2026-11-24T09:15:00.000Z'
      }
    ]
  },
  {
    id: '44444444-4444-4444-8444-444444444403',
    garment_id: '22222222-2222-4222-8222-222222222205',
    borrower_id: '11111111-1111-4111-8111-111111111104',
    lender_id: '11111111-1111-4111-8111-111111111105',
    start_date: '2026-11-18',
    end_date: '2026-11-20',
    buffer_end_date: '2026-11-21',
    handoff_mode: 'P2P_MEETUP',
    rental_amount: 1080,
    platform_fee: 108,
    pickup_fee: 0,
    deposit_amount: 1500,
    payment_status: 'DISPUTED',
    booking_status: 'DISPUTED',
    inspection_qr_token: 'RWQR-44444403-22222205-5E8A2D6C1B9F03',
    garment: INITIAL_GARMENTS[4],
    borrower: INITIAL_USERS[3],
    lender: INITIAL_USERS[4],
    condition_logs: [
      {
        id: '504',
        stage: 'PRE_HANDOFF',
        device_id: 'ESP32-CAM-JAYANAGAR-BOOTH-03',
        led_lux_level: 860,
        condition_score: 99,
        detected_defects: [],
        photo_urls: [
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80'
        ],
        checklist_json: {
          stains: false,
          tears: false,
          buttons_zippers: false,
          odor: false,
          missing_items: false
        },
        notes: 'Pre-handoff baseline scan at Jayanagar 4th Block station (Score: 99/100, Zero defects).',
        created_at: '2026-11-18T11:00:00.000Z'
      },
      {
        id: '505',
        stage: 'AT_RETURN',
        device_id: 'ESP32-CAM-JAYANAGAR-BOOTH-03',
        led_lux_level: 880,
        condition_score: 64,
        detected_defects: [
          {
            id: 'def-stain-01',
            type: 'STAIN',
            label: 'Beverage / Oil Stain on Lower Satin Hemline (4.2 cm)',
            severity: 'HIGH',
            confidence: 0.96,
            estimated_repair_cost_inr: 250,
            bbox: { x: 28, y: 68, width: 22, height: 18 }
          },
          {
            id: 'def-tear-02',
            type: 'LOOSE_THREAD_OR_SNAG',
            label: 'Concealed Zipper Slider Snag & Loose Seam Thread',
            severity: 'MEDIUM',
            confidence: 0.93,
            estimated_repair_cost_inr: 200,
            bbox: { x: 54, y: 34, width: 18, height: 16 }
          }
        ],
        photo_urls: [
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80'
        ],
        checklist_json: {
          stains: true,
          tears: false,
          buttons_zippers: true,
          odor: false,
          missing_items: false
        },
        notes: 'AI Vision detected 2 anomalies at return (Score: 64/100): Beverage stain near bottom satin hem (4.2cm) and concealed back zipper slider snag.',
        created_at: '2026-11-20T18:40:00.000Z'
      }
    ]
  },
  {
    id: '44444444-4444-4444-8444-444444444401',
    garment_id: '22222222-2222-4222-8222-222222222201',
    borrower_id: '11111111-1111-4111-8111-111111111103',
    lender_id: '11111111-1111-4111-8111-111111111101',
    start_date: '2026-11-10',
    end_date: '2026-11-12',
    buffer_end_date: '2026-11-13',
    handoff_mode: 'CONCIERGE_PICKUP',
    rental_amount: 3300,
    platform_fee: 330,
    pickup_fee: 180,
    deposit_amount: 4500,
    payment_status: 'RELEASED',
    booking_status: 'COMPLETED',
    inspection_qr_token: 'RWQR-44444401-22222201-9A4F8C2E1D7B01',
    garment: INITIAL_GARMENTS[0],
    borrower: INITIAL_USERS[2],
    lender: INITIAL_USERS[0],
    condition_logs: [
      {
        id: '501',
        stage: 'PRE_HANDOFF',
        device_id: 'ESP32-CAM-DSU-HAROHALLI-01',
        led_lux_level: 865,
        condition_score: 99,
        detected_defects: [],
        photo_urls: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
        ],
        checklist_json: {
          stains: false,
          tears: false,
          buttons_zippers: false,
          odor: false,
          missing_items: false
        },
        notes: 'All 3 pieces verified intact with seal tag #RW-902.',
        created_at: '2026-11-10T08:30:00.000Z'
      },
      {
        id: '502',
        stage: 'AT_RETURN',
        device_id: 'ESP32-CAM-DSU-HAROHALLI-01',
        led_lux_level: 870,
        condition_score: 98,
        detected_defects: [],
        photo_urls: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'
        ],
        checklist_json: {
          stains: false,
          tears: false,
          buttons_zippers: false,
          odor: false,
          missing_items: false
        },
        notes: 'Returned in pristine condition via ReWear Concierge.',
        created_at: '2026-11-12T19:00:00.000Z'
      }
    ]
  }
];

export const INITIAL_DISPUTES = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    booking_id: '44444444-4444-4444-8444-444444444403',
    raised_by_id: '11111111-1111-4111-8111-111111111105',
    reason:
      'Coffee/mocktail spill stain on champagne satin hemline and snagged concealed zipper slider requiring partner dry-cleaning & tailor slider fix.',
    deposit_deduction_amount: 450,
    resolution_status: 'UNDER_REVIEW',
    admin_notes:
      'ReWear Trust Team reviewing repair quote from StitchCraft Studio Jayanagar (₹200 zipper fix + ₹250 enzyme stain removal). Remaining ₹1,050 escrow deposit slated for borrower refund.',
    booking: INITIAL_BOOKINGS[1],
    raised_by: INITIAL_USERS[4]
  }
];

export const INITIAL_PARTNERS = [
  {
    id: '901',
    name: 'GreenSteam Eco Dry Cleaners & Ozone Care',
    service_type: 'DRY_CLEANING',
    area: 'Kanakapura Road & Harohalli (DSU Main Corridor)',
    contact_phone: '+91-8026641122',
    pricing_note:
      'Flat 25% ReWear Student Discount • Sarees ₹180 | 3-Pc Suits ₹320 | Bridal Lehengas ₹550 (24hr turnaround)',
    verified_badge: true
  },
  {
    id: '902',
    name: 'Masterji Sartorial & Bridal Alterations',
    service_type: 'TAILOR_REPAIR',
    area: 'Kumaraswamy Layout (Opposite DSCE Gate)',
    contact_phone: '+91-9900145588',
    pricing_note: 'Reversible temporary waist/blouse margin tucks from ₹90 • Zipper & hook replacements ₹120',
    verified_badge: true
  },
  {
    id: '903',
    name: 'StitchCraft Couture Repair & Darning Studio',
    service_type: 'TAILOR_REPAIR',
    area: 'Jayanagar 4th Block',
    contact_phone: '+91-9845322190',
    pricing_note: 'Invisible silk darning, zardozi bead re-stitching, and satin hem restoration starting at ₹150',
    verified_badge: true
  },
  {
    id: '904',
    name: 'FabCare Express Lagoon Laundry',
    service_type: 'DRY_CLEANING',
    area: 'Koramangala & Kudlu Gate (DSU Innovation Campus)',
    contact_phone: '+91-8041239900',
    pricing_note: 'Woolmark-certified wet cleaning • Express 18-hour buffer turnaround for ₹280/garment',
    verified_badge: true
  },
  {
    id: '905',
    name: 'Relove Circular Thrift & Consignment Collective',
    service_type: 'RESALE',
    area: 'Indiranagar & Koramangala 5th Block',
    contact_phone: '+91-9741088321',
    pricing_note: 'Instant buyout or 80/20 consignment payout for ReWear garments retiring after 15+ rental cycles',
    verified_badge: true
  },
  {
    id: '906',
    name: 'Goonj & Hasiru Dala Textile Upcycle Drop-Point',
    service_type: 'DONATION',
    area: 'Jayanagar & Banashankari',
    contact_phone: '+91-8026539911',
    pricing_note: 'Free doorstep collection for retired textiles; issues verified Green Circularity Certificate',
    verified_badge: true
  }
];
