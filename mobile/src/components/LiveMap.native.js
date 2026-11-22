import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { isCoordinate } from '../utils/validation';
import { theme } from '../theme';
import V3Icon from './V3Icon';

function ReportMarker({ type }) {
  const asset = type === 'Kemacetan' ? 'markerTraffic' : type === 'Hambatan' || type === 'Laporan' ? 'markerObstacle' : 'markerFlood';
  const obstacle = type === 'Hambatan' || type === 'Laporan';
  return <View collapsable={false} style={{ width: 38, height: 38 }}><V3Icon name={asset} /><View style={{ position: 'absolute', left: obstacle ? 14 : 17.5, top: obstacle ? 14 : 10.5 }}><V3Icon name={obstacle ? 'markerObstacleSign' : 'markerSign'} /></View></View>;
}

export default function LiveMap({ reports = [], facilities = [], points = [], selectedPoint, onSelectReport, onSelectFacility, onPick, routeGeometry, height = 230 }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const coordinates = [selectedPoint?.coordinate, ...points.map(point => point?.coordinate), ...reports.map(report => report.location?.coordinate), ...facilities.map(facility => facility.location?.coordinate)].filter(isCoordinate);
  const center = coordinates[0] || { latitude: -6.9, longitude: 107.61 };
  const region = { ...center, latitudeDelta: 0.04, longitudeDelta: 0.04 };
  useEffect(() => {
    if (!ready) return;
    if (coordinates.length > 1) ref.current?.fitToCoordinates(coordinates, { edgePadding: { top: 50, right: 35, bottom: 50, left: 35 }, animated: true });
    else ref.current?.animateToRegion(region, 250);
  }, [ready, JSON.stringify(coordinates)]);
  return <MapView onMapReady={() => setReady(true)} ref={ref} style={[styles.map, { height }]} initialRegion={region} onPress={event => onPick?.({ label: 'Titik yang dipilih', coordinate: event.nativeEvent.coordinate, source: 'map' })}>
    {reports.filter(report => isCoordinate(report.location?.coordinate)).map(report => <Marker key={report.id} coordinate={report.location.coordinate} title={report.title} onPress={event => { event.stopPropagation(); onSelectReport?.(report); }}><ReportMarker type={report.type} /></Marker>)}
    {facilities.filter(facility => isCoordinate(facility.location?.coordinate)).map(facility => <Marker key={facility.id} coordinate={facility.location.coordinate} title={facility.name} onPress={event => { event.stopPropagation(); onSelectFacility?.(facility); }}><View collapsable={false} style={{ width: 33.5, height: 33.5 }}><V3Icon name="facilityMarkerA" /></View></Marker>)}
    {points.filter(point => isCoordinate(point?.coordinate)).map((point, index) => <Marker key={index} coordinate={point.coordinate} title={point.label} onPress={event => { event.stopPropagation(); onPick?.({ ...point, source: 'map' }); }} pinColor={index ? theme.colors.danger : theme.colors.primary} />)}
    {isCoordinate(selectedPoint?.coordinate) && <Marker coordinate={selectedPoint.coordinate} title={selectedPoint.label || 'Titik yang dipilih'} pinColor={theme.colors.primary} />}
    {Array.isArray(routeGeometry) && routeGeometry.length > 1 && routeGeometry.every(isCoordinate) && <Polyline coordinates={routeGeometry} strokeWidth={5} strokeColor={theme.colors.primary} />}
  </MapView>;
}

const styles = StyleSheet.create({ map: { width: '100%' } });
