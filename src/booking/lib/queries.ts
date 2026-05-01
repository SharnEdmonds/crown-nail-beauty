// GROQ queries for the booking module. Booking-module-only — never imported from marketing-site code.

export const BOOKING_THEME_QUERY = /* groq */ `
  *[_type == "bookingTheme"][0]{
    _id,
    _type,
    logoPrimary{ ..., asset->{_id, url, metadata} },
    logoSubmark{ ..., asset->{_id, url, metadata} },
    logoEmailHeader{ ..., asset->{_id, url, metadata} },
    colorBackground,
    colorSurface,
    colorSurfaceMuted,
    colorBorder,
    colorBorderFocus,
    colorTextPrimary,
    colorTextSecondary,
    colorTextMuted,
    colorAccent,
    colorAccentMuted,
    colorSuccess,
    colorWarning,
    colorError,
    colorOnAccent,
    colorStepActive,
    colorStepCompleted,
    colorStepPending,
    colorSlotAvailable,
    colorSlotSelected,
    colorSlotUnavailable,
    headingFontFamily,
    bodyFontFamily,
    monoFontFamily,
    radiusSm,
    radiusMd,
    radiusLg,
    radiusFull,
    emailBackgroundColor,
    emailCardColor,
    emailFooterText
  }
`;

export const BOOKING_COPY_QUERY = /* groq */ `
  *[_type == "bookingCopy"][0]
`;

export const BOOKING_SETTINGS_QUERY = /* groq */ `
  *[_type == "bookingSettings"][0]{
    _id,
    _type,
    isBookingEnabled,
    salonTimezone,
    slotIntervalMinutes,
    minHoursAheadToBook,
    maxDaysAheadToBook,
    cancellationCutoffHours,
    pendingPaymentTtlMinutes,
    publicHolidayDates,
    cancellationPolicyText,
    privacyPolicyText,
    ownerNotificationEmails,
    contactPhoneOverride
  }
`;

export const BOOKING_SERVICES_QUERY = /* groq */ `
  *[_type == "bookingService" && isActive == true] | order(order asc, title asc){
    _id,
    _type,
    title,
    slug,
    description,
    durationMinutes,
    bufferMinutes,
    price,
    deposit,
    linkedCategorySlug,
    order,
    isActive,
    imageOptional{ ..., asset->{_id, url, metadata} }
  }
`;

export const TECHNICIANS_QUERY = /* groq */ `
  *[_type == "technician" && isActive == true] | order(order asc, name asc){
    _id,
    _type,
    name,
    slug,
    photo{ ..., asset->{_id, url, metadata} },
    bio,
    specialty,
    "services": services[]->_id,
    weeklySchedule[]{
      dayOfWeek,
      isWorkingDay,
      startTime,
      endTime,
      breakStart,
      breakEnd
    },
    timeOff,
    isActive,
    order
  }
`;

export const TECHNICIAN_BY_ID_QUERY = /* groq */ `
  *[_type == "technician" && _id == $id][0]{
    _id,
    _type,
    name,
    slug,
    "services": services[]->_id,
    weeklySchedule[]{
      dayOfWeek,
      isWorkingDay,
      startTime,
      endTime,
      breakStart,
      breakEnd
    },
    timeOff,
    isActive,
    specialty
  }
`;

export const BOOKING_SERVICE_BY_ID_QUERY = /* groq */ `
  *[_type == "bookingService" && _id == $id][0]{
    _id,
    title,
    durationMinutes,
    bufferMinutes,
    price,
    deposit,
    isActive,
    order
  }
`;

export const BOOKING_SERVICES_BY_IDS_QUERY = /* groq */ `
  *[_type == "bookingService" && _id in $ids]{
    _id,
    title,
    durationMinutes,
    bufferMinutes,
    price,
    deposit,
    isActive,
    order
  }
`;
