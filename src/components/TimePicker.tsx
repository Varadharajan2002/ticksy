import React, { useState, useEffect, useRef } from "react";
import './TimePicker.scss';

export interface TimePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    touched?: boolean;
    isRequired?: boolean;
    errorMessage?: string;
    use24Hour?: boolean;
    placeholder?: string;
    color?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
    label,
    value,
    onChange,
    disabled = false,
    error = false,
    touched = false,
    isRequired = false,
    errorMessage = "",
    use24Hour = false,
    placeholder = "Choose time",
    color = 'purple'        
}) => {
    const [timeString, setTimeString] = useState("");
    const [period, setPeriod] = useState("AM");
    const [showClock, setShowClock] = useState(false);
    const [selectingHours, setSelectingHours] = useState(true);
    const [selectedHour, setSelectedHour] = useState(use24Hour ? 0 : 12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const clockRef = useRef<HTMLDivElement>(null);
    const clockContainerRef = useRef<HTMLDivElement>(null);

    // Parse time value on mount and when value changes
    useEffect(() => {
        if (value && typeof value === 'string') {
            const { timeStr, periodValue, hours, minutes } = parseTimeValue(value);
            setTimeString(timeStr);
            setPeriod(periodValue);
            setSelectedHour(hours);
            setSelectedMinute(minutes);
        }
    }, [value]);

    // Close the clock when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (clockContainerRef.current && !clockContainerRef.current.contains(event.target as Node)) {
                setShowClock(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Setup dragging handlers
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (isDragging && clockRef.current) {
                event.preventDefault();
                handleClockInteraction({
                    clientX: event.clientX,
                    clientY: event.clientY
                });
            }
        };

        const handleMouseUp = (event: MouseEvent) => {
            if (isDragging) {
                event.preventDefault();
                handleClockInteraction({
                    clientX: event.clientX,
                    clientY: event.clientY
                });
                setIsDragging(false);

                if (selectingHours) {
                    setSelectingHours(false);
                }
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (isDragging && clockRef.current) {
                event.preventDefault();
                const touch = event.touches[0];
                handleClockInteraction({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (isDragging) {
                event.preventDefault();
                if (event.changedTouches.length > 0) {
                    const touch = event.changedTouches[0];
                    handleClockInteraction({
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                }
                setIsDragging(false);

                if (selectingHours) {
                    setSelectingHours(false);
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, selectingHours]);

    const parseTimeValue = (timeValue: string) => {
        if (!timeValue || typeof timeValue !== 'string') {
            return {
                timeStr: use24Hour ? "00:00" : "12:00",
                periodValue: "AM",
                hours: use24Hour ? 0 : 12,
                minutes: 0
            };
        }

        try {
            if (timeValue.includes(" ")) {
                // 12-hour format with AM/PM
                const [time, periodVal] = timeValue.trim().split(" ");
                const [hoursStr, minutesStr] = time.split(":");
                let hours = parseInt(hoursStr, 10) || 12;
                const minutes = parseInt(minutesStr, 10) || 0;

                if (hours > 12) {
                    hours = hours - 12;
                } else if (hours === 0) {
                    hours = 12;
                }

                return {
                    timeStr: `${hours}:${minutes.toString().padStart(2, '0')}`,
                    periodValue: periodVal.toUpperCase(),
                    hours,
                    minutes
                };
            } else if (timeValue.includes(":")) {
                // 24-hour format or 12-hour without AM/PM
                const [hoursStr, minutesStr] = timeValue.split(":");
                let hours = parseInt(hoursStr, 10);
                const minutes = parseInt(minutesStr, 10) || 0;

                if (use24Hour) {
                    return {
                        timeStr: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                        periodValue: "AM",
                        hours,
                        minutes
                    };
                } else {
                    let periodValue = "AM";
                    let displayHours = hours;

                    if (hours >= 12) {
                        periodValue = "PM";
                        if (hours > 12) {
                            displayHours = hours - 12;
                        }
                    } else if (hours === 0) {
                        displayHours = 12;
                    }

                    return {
                        timeStr: `${displayHours}:${minutes.toString().padStart(2, '0')}`,
                        periodValue,
                        hours: displayHours,
                        minutes
                    };
                }
            }

            return {
                timeStr: use24Hour ? "00:00" : "12:00",
                periodValue: "AM",
                hours: use24Hour ? 0 : 12,
                minutes: 0
            };
        } catch (error) {
            console.error("Error parsing time value:", error);
            return {
                timeStr: use24Hour ? "00:00" : "12:00",
                periodValue: "AM",
                hours: use24Hour ? 0 : 12,
                minutes: 0
            };
        }
    };

    const toggleClock = () => {
        if (!disabled) {
            setShowClock(!showClock);
        }
    };

    const handleTimeInputClick = () => {
        toggleClock();
    };

    const handlePeriodToggle = () => {
        if (!use24Hour) {
            const newPeriod = period === "AM" ? "PM" : "AM";
            setPeriod(newPeriod);
            updateTimeValue(selectedHour, selectedMinute, newPeriod);
        }
    };

    const updateTimeValue = (hours: number, minutes: number, periodValue = period) => {
        setSelectedHour(hours);
        setSelectedMinute(minutes);

        if (use24Hour) {
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            setTimeString(formattedTime);
            onChange(formattedTime);
        } else {
            const formattedMinutes = minutes.toString().padStart(2, '0');
            setTimeString(`${hours}:${formattedMinutes}`);
            const formattedTime = `${hours}:${formattedMinutes} ${periodValue}`;
            onChange(formattedTime);
        }
    };

    const handleClockInteraction = (coords: { clientX: number; clientY: number }) => {
        if (!clockRef.current) return;

        const rect = clockRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const x = coords.clientX - rect.left - centerX;
        const y = coords.clientY - rect.top - centerY;

        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = Math.min(rect.width, rect.height) / 2;

        if (distance <= maxDistance * 1.2) {
            let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (angle < 0) angle += 360;

            if (selectingHours) {
                if (use24Hour) {
                    // For 24-hour format, we need to determine inner/outer ring
                    const innerRadius = maxDistance * 0.6;
                    const isInnerRing = distance < innerRadius;

                    const hour24 = Math.round(angle / 30) % 12;
                    let hourValue;

                    if (isInnerRing) {
                        // Inner ring: 1-12 (or 13-24 in 24-hour)
                        hourValue = hour24 === 0 ? 12 : hour24;
                    } else {
                        // Outer ring: 13-24 (or 1-12 in 12-hour)
                        hourValue = hour24 === 0 ? 0 : hour24;
                        if (!isInnerRing && use24Hour) {
                            hourValue = hourValue === 12 ? 0 : hourValue + 12;
                        }
                    }

                    setSelectedHour(hourValue);
                    updateTimeValue(hourValue, selectedMinute);
                } else {
                    const hour = Math.round(angle / 30) % 12;
                    const hourValue = hour === 0 ? 12 : hour;
                    setSelectedHour(hourValue);
                    updateTimeValue(hourValue, selectedMinute);
                }
            } else {
                const minute = Math.round(angle / 6) % 60;
                setSelectedMinute(minute);
                updateTimeValue(selectedHour, minute);
            }
        }
    };

    const handleClockSelection = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        let coords: { clientX: number; clientY: number };

        if ('touches' in event && event.touches.length > 0) {
            const touch = event.touches[0];
            coords = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
        } else if ('clientX' in event) {
            coords = {
                clientX: event.clientX,
                clientY: event.clientY
            };
        } else {
            return;
        }

        handleClockInteraction(coords);
        setIsDragging(true);
    };

    const handleModeToggle = (mode: 'hours' | 'minutes') => {
        setSelectingHours(mode === 'hours');
    };

    const handleTimeSubmit = () => {
        setShowClock(false);
    };

    const generateClockNumbers = () => {
        if (selectingHours) {
            if (use24Hour) {
                // Generate both inner (1-12) and outer (13-24/0) numbers for 24-hour format
                const numbers = [];

                // Outer ring: 0, 13-23 (increased radius for more gap)
                for (let i = 0; i < 12; i++) {
                    const hour = i === 0 ? 0 : i + 12;
                    const displayHour = hour === 0 ? "00" : hour.toString();
                    const angle = (i * 30) - 90;
                    const radians = angle * (Math.PI / 180);
                    const radius = 42; // Increased from 40 to 42

                    const left = 50 + radius * Math.cos(radians);
                    const top = 50 + radius * Math.sin(radians);

                    const isSelected = hour === selectedHour;

                    numbers.push(
                        <div
                            key={`outer-${hour}`}
                            className={`clock-number outer-number ${isSelected ? 'selected' : ''}`}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHour(hour);
                                updateTimeValue(hour, selectedMinute);
                                setSelectingHours(false);
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                setSelectedHour(hour);
                                updateTimeValue(hour, selectedMinute);
                                setSelectingHours(false);
                            }}
                        >
                            {displayHour}
                        </div>
                    );
                }

                for (let i = 1; i <= 12; i++) {
                    const hour = i;
                    const angle = ((hour % 12) * 30) - 90;
                    const radians = angle * (Math.PI / 180);
                    const radius = 25; // Increased back to 25 for better spacing from center

                    const left = 50 + radius * Math.cos(radians);
                    const top = 50 + radius * Math.sin(radians);

                    const isSelected = hour === selectedHour;

                    numbers.push(
                        <div
                            key={`inner-${hour}`}
                            className={`clock-number inner-number ${isSelected ? 'selected' : ''}`}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHour(hour);
                                updateTimeValue(hour, selectedMinute);
                                setSelectingHours(false);
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                setSelectedHour(hour);
                                updateTimeValue(hour, selectedMinute);
                                setSelectingHours(false);
                            }}
                        >
                            {hour}
                        </div>
                    );
                }

                return numbers;
            } else {
                // 12-hour format (original logic)
                return Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 1;
                    const angle = ((hour % 12) * 30) - 90;
                    const radians = angle * (Math.PI / 180);
                    const radius = 40;

                    const left = 50 + radius * Math.cos(radians);
                    const top = 50 + radius * Math.sin(radians);

                    const isSelected = hour === selectedHour;

                    return (
                        <div
                            key={hour}
                            className={`clock-number ${isSelected ? 'selected' : ''}`}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHour(hour);
                                updateTimeValue(hour, selectedMinute);
                                setSelectingHours(false);
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                setSelectedHour(hour);
                                updateTimeValue(hour, selectedMinute);
                                setSelectingHours(false);
                            }}
                        >
                            {hour}
                        </div>
                    );
                });
            }
        } else {
            // Minutes (same for both formats)
            return Array.from({ length: 12 }, (_, i) => {
                const minute = i * 5;
                const angle = (minute * 6) - 90;
                const radians = angle * (Math.PI / 180);
                const radius = 40;

                const left = 50 + radius * Math.cos(radians);
                const top = 50 + radius * Math.sin(radians);

                const isSelected = minute === selectedMinute || (minute === 0 && selectedMinute === 60);

                return (
                    <div
                        key={minute}
                        className={`clock-number ${isSelected ? 'selected' : ''}`}
                        style={{
                            left: `${left}%`,
                            top: `${top}%`,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMinute(minute);
                            updateTimeValue(selectedHour, minute);
                        }}
                        onTouchEnd={(e) => {
                            e.stopPropagation();
                            setSelectedMinute(minute);
                            updateTimeValue(selectedHour, minute);
                        }}
                    >
                        {minute.toString().padStart(2, '0')}
                    </div>
                );
            });
        }
    };

    const calculateHourHandAngle = () => {
        if (use24Hour) {
            return ((selectedHour % 12) * 30 + (selectedMinute / 60) * 30) - 90;
        }
        return ((selectedHour % 12) * 30 + (selectedMinute / 60) * 30) - 90;
    };

    const calculateMinuteHandAngle = () => {
        return (selectedMinute * 6) - 90;
    };

    const hourHandAngle = calculateHourHandAngle();
    const minuteHandAngle = calculateMinuteHandAngle();

    return (
        <div
            className={`time-picker ${disabled ? 'disabled' : ''} ${error && touched ? 'error' : ''}`}
            style={{ '--clock-color': color } as React.CSSProperties}
        >
            {label && (
                <label>
                    {label} {isRequired && <span className="required">*</span>}
                </label>
            )}

            <div className="time-input-container" ref={clockContainerRef}>
                <input
                    type="text"
                    className="time-input"
                    value={value && timeString ? `${timeString}${!use24Hour ? ` ${period}` : ''}` : ''}
                    onClick={handleTimeInputClick}
                    onTouchEnd={handleTimeInputClick}
                    placeholder={placeholder}
                    readOnly
                    disabled={disabled}
                    aria-label="Time"
                />

                {showClock && (
                    <div className="clock-container">
                        <div className="clock-header">
                            <div className="clock-time-display">
                                <span
                                    className={`clock-hours ${selectingHours ? 'active' : ''}`}
                                    onClick={() => handleModeToggle('hours')}
                                    onTouchEnd={() => handleModeToggle('hours')}
                                >
                                    {use24Hour ? selectedHour.toString().padStart(2, '0') : selectedHour}
                                </span>
                                <span className="clock-separator">:</span>
                                <span
                                    className={`clock-minutes ${!selectingHours ? 'active' : ''}`}
                                    onClick={() => handleModeToggle('minutes')}
                                    onTouchEnd={() => handleModeToggle('minutes')}
                                >
                                    {selectedMinute.toString().padStart(2, '0')}
                                </span>
                                {!use24Hour && (
                                    <span
                                        className="clock-period"
                                        onClick={handlePeriodToggle}
                                        onTouchEnd={handlePeriodToggle}
                                    >
                                        {period}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div
                            className={`clock-face ${use24Hour ? 'clock-24hour' : ''}`}
                            ref={clockRef}
                            onMouseDown={handleClockSelection}
                            onTouchStart={handleClockSelection}
                        >
                            <div className="clock-center"></div>

                            {selectingHours ? (
                                <div
                                    className={`clock-hand hour-hand active`}
                                    style={{
                                        transform: `rotate(${hourHandAngle}deg)`,
                                        width: use24Hour ? '10%' : '15%' // Smaller width for 24hr mode
                                    }}
                                ></div>
                            ) : (
                                <div
                                    className={`clock-hand minute-hand active`}
                                    style={{
                                        transform: `rotate(${minuteHandAngle}deg)`,
                                        width: '15%'
                                    }}
                                ></div>
                            )}
                            {generateClockNumbers()}
                        </div>

                        <div className="clock-actions">
                            <button
                                className="clock-cancel"
                                onClick={() => setShowClock(false)}
                                onTouchEnd={() => setShowClock(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="clock-ok"
                                onClick={handleTimeSubmit}
                                onTouchEnd={handleTimeSubmit}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && touched && errorMessage && (
                <p className="error-message">{errorMessage}</p>
            )}
        </div>
    );
};

export default TimePicker;